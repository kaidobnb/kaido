import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Badge from '../models/Badge';
import mongoose from 'mongoose';

// Get all badges
export const getAllBadges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const badges = await Badge.find();
    res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badges' });
  }
};

// Get user badges
export const getUserBadges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).populate({
      path: 'badges.badgeId',
      model: 'Badge',
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Format badges for frontend
    const badges = user.badges.map((badge) => {
      const badgeData = badge.badgeId as any;

      return {
        id: badgeData._id ? badgeData._id.toString() : '',
        name: badgeData.name,
        description: badgeData.description,
        icon: badgeData.icon,
        category: badgeData.category,
        tier: badgeData.tier,
        rarity: badgeData.rarity,
        dateAwarded: badge.dateAwarded,
        progress: badge.progress,
        locked: false,
      };
    });

    res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user badges' });
  }
};

// Check for new badges
export const checkForNewBadges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // If user has no badge notifications, return empty array
    if (!user.badgeNotifications) {
      res.status(200).json({ success: true, newBadges: [] });
      return;
    }

    // Get user's most recently earned badges (last 5)
    const userWithBadges = await User.findById(userId)
      .populate({
        path: 'badges.badgeId',
        model: 'Badge',
      })
      .sort({ 'badges.dateAwarded': -1 })
      .limit(5);

    if (!userWithBadges) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Format badges for frontend
    const newBadges = userWithBadges.badges
      .sort((a, b) => new Date(b.dateAwarded).getTime() - new Date(a.dateAwarded).getTime())
      .slice(0, 5)
      .map((badge) => {
        const badgeData = badge.badgeId as any;

        return {
          id: badgeData._id ? badgeData._id.toString() : '',
          name: badgeData.name,
          description: badgeData.description,
          icon: badgeData.icon,
          category: badgeData.category,
          tier: badgeData.tier,
          rarity: badgeData.rarity,
          dateAwarded: badge.dateAwarded,
          locked: false,
        };
      });

    res.status(200).json({ success: true, newBadges });
  } catch (error) {
    console.error('Error checking for new badges:', error);
    res.status(500).json({ success: false, message: 'Failed to check for new badges' });
  }
};

// Mark badge notifications as read
export const markBadgeNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { badgeNotifications: false },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking badge notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark badge notifications as read',
    });
  }
};

// Award a badge to a user (admin only)
export const awardBadge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, badgeId } = req.body;

    // Check if user is admin
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
      return;
    }

    // Check if badge exists
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      res.status(404).json({ success: false, message: 'Badge not found' });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if user already has this badge
    const hasBadge = user.badges.some(
      (b) => b.badgeId.toString() === badgeId
    );

    if (hasBadge) {
      res.status(400).json({
        success: false,
        message: 'User already has this badge',
      });
      return;
    }

    // Award badge to user
    user.badges.push({
      badgeId: new mongoose.Types.ObjectId(badgeId),
      dateAwarded: new Date(),
      progress: 100,
    });

    // Set badge notification flag
    user.badgeNotifications = true;

    await user.save();

    res.status(200).json({ success: true, message: 'Badge awarded successfully' });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ success: false, message: 'Failed to award badge' });
  }
};

export default {
  getAllBadges,
  getUserBadges,
  checkForNewBadges,
  markBadgeNotificationsAsRead,
  awardBadge,
};
