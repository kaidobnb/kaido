import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { IUser } from '../models/User';

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { type, status, limit = 20, page = 1 } = req.query;

    // Build query
    const query: any = { user: user._id };

    if (type) query.type = type;
    if (status) query.status = status;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('prediction', 'title type asset');

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deposit funds
// @route   POST /api/transactions/deposit
// @access  Private
export const depositFunds = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { amount, tokenType, txHash } = req.body;

    if (!amount || !tokenType) {
      return res.status(400).json({ message: 'Please provide amount and token type' });
    }

    // Validate token type
    if (tokenType !== 'SOL' && tokenType !== 'SOLY') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount,
      tokenType,
      txHash,
      status: 'completed'
    });

    // Update user balance
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        [`balances.${tokenType}`]: amount
      }
    });

    // Get updated user
    const updatedUser = await User.findById(user._id);

    res.status(201).json({
      success: true,
      transaction,
      balances: updatedUser?.balances
    });
  } catch (error) {
    console.error('Error depositing funds:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Withdraw funds
// @route   POST /api/transactions/withdraw
// @access  Private
export const withdrawFunds = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { amount, tokenType, destinationAddress } = req.body;

    if (!amount || !tokenType || !destinationAddress) {
      return res.status(400).json({
        message: 'Please provide amount, token type, and destination address'
      });
    }

    // Validate token type
    if (tokenType !== 'SOL' && tokenType !== 'SOLY') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    // Check if user has enough balance
    if ((user.balances as any)[tokenType] < amount) {
      return res.status(400).json({ message: `Insufficient ${tokenType} balance` });
    }

    // Create transaction record (initially pending)
    const transaction = await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount,
      tokenType,
      status: 'pending'
    });

    // Update user balance
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        [`balances.${tokenType}`]: -amount
      }
    });

    // In a real implementation, this would trigger a blockchain transaction
    // For now, we'll simulate a successful withdrawal
    setTimeout(async () => {
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'completed',
        txHash: `sim_${Date.now()}`
      });
    }, 2000);

    // Get updated user
    const updatedUser = await User.findById(user._id);

    res.status(200).json({
      success: true,
      transaction,
      balances: updatedUser?.balances,
      message: 'Withdrawal initiated'
    });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user portfolio summary
// @route   GET /api/transactions/portfolio
// @access  Private
export const getPortfolioSummary = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    // Get user's active participations
    const activeParticipations = await Transaction.aggregate([
      { $match: { user: user._id, type: 'prediction' } },
      { $group: { _id: '$tokenType', total: { $sum: '$amount' } } }
    ]);

    // Get user's winnings
    const winnings = await Transaction.aggregate([
      { $match: { user: user._id, type: 'win' } },
      { $group: { _id: '$tokenType', total: { $sum: '$amount' } } }
    ]);

    // Get user's deposits
    const deposits = await Transaction.aggregate([
      { $match: { user: user._id, type: 'deposit' } },
      { $group: { _id: '$tokenType', total: { $sum: '$amount' } } }
    ]);

    // Get user's withdrawals
    const withdrawals = await Transaction.aggregate([
      { $match: { user: user._id, type: 'withdrawal', status: 'completed' } },
      { $group: { _id: '$tokenType', total: { $sum: '$amount' } } }
    ]);

    // Format results
    const formatResults = (results: any[]) => {
      const formatted: { [key: string]: number } = { SOL: 0, SOLY: 0 };
      results.forEach(item => {
        formatted[item._id] = item.total;
      });
      return formatted;
    };

    const portfolio = {
      balances: user.balances,
      activeParticipations: formatResults(activeParticipations),
      winnings: formatResults(winnings),
      deposits: formatResults(deposits),
      withdrawals: formatResults(withdrawals)
    };

    res.status(200).json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
