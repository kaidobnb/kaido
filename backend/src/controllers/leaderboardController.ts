import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { timeRange = 'allTime', limit = 20, page = 1 } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build query based on time range
    let dateFilter = {};
    const now = new Date();

    if (timeRange === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeRange === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // If using time range, we need to calculate stats within that range
    if (timeRange !== 'allTime') {
      // Get users with transactions in the time range
      const usersWithActivity = await Transaction.distinct('user', dateFilter);

      // For each user, calculate their stats in the time range
      const userStats = [];

      for (const userId of usersWithActivity) {
        // Get user's predictions in time range
        const predictions = await Transaction.countDocuments({
          user: userId,
          type: 'prediction',
          ...dateFilter
        });

        // Get user's wins in time range
        const wins = await Transaction.countDocuments({
          user: userId,
          type: 'win',
          ...dateFilter
        });

        // Get user's volume in time range
        const volumeResult = await Transaction.aggregate([
          {
            $match: {
              user: userId,
              type: 'prediction',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const volume = volumeResult.length > 0 ? volumeResult[0].total : 0;

        // Get user details
        const user = await User.findById(userId).select('username avatar reputation');

        if (user && predictions > 0) {
          userStats.push({
            _id: userId,
            username: user.username,
            avatar: user.avatar,
            reputation: user.reputation,
            totalPredictions: predictions,
            wonPredictions: wins,
            winRate: predictions > 0 ? wins / predictions : 0,
            volume
          });
        }
      }

      // Sort by reputation
      userStats.sort((a, b) => b.reputation - a.reputation);

      // Apply pagination
      const paginatedStats = userStats.slice(skip, skip + Number(limit));

      // Add rank
      const rankedStats = paginatedStats.map((user, index) => ({
        ...user,
        rank: skip + index + 1
      }));

      return res.status(200).json({
        success: true,
        count: rankedStats.length,
        total: userStats.length,
        page: Number(page),
        pages: Math.ceil(userStats.length / Number(limit)),
        leaderboard: rankedStats
      });
    }

    // For all-time stats, we can use the stored values
    const users = await User.find({ totalPredictions: { $gt: 0 } })
      .select('username avatar reputation winRate totalPredictions wonPredictions totalVolume')
      .sort({ reputation: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await User.countDocuments({ totalPredictions: { $gt: 0 } });

    // Add rank
    const leaderboard = users.map((user, index) => ({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      reputation: user.reputation,
      winRate: user.winRate,
      totalPredictions: user.totalPredictions,
      wonPredictions: user.wonPredictions,
      volume: user.totalVolume,
      rank: skip + index + 1
    }));

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user rank
// @route   GET /api/leaderboard/rank
// @access  Private
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Get all users with predictions, sorted by reputation
    const users = await User.find({ totalPredictions: { $gt: 0 } })
      .select('_id reputation')
      .sort({ reputation: -1 });

    // Find user's position in the array
    const userIndex = users.findIndex(user => (user._id as any).toString() === userId.toString());

    if (userIndex === -1) {
      return res.status(200).json({
        success: true,
        rank: null,
        message: 'User has not participated in any predictions'
      });
    }

    // User's rank is their position + 1
    const rank = userIndex + 1;

    res.status(200).json({
      success: true,
      rank
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
