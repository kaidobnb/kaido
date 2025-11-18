import express, { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { subAdminOnly } from '../middleware/subAdminMiddleware';
import AdminSettings from '../models/AdminSettings';
import Transaction from '../models/Transaction';
import Prediction from '../models/Prediction';
import User from '../models/User';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected and require sub-admin access
router.use(protect);
router.use(subAdminOnly);

// Get admin wallet information
router.get('/wallets', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get the admin wallet address from environment variables
    const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;

    if (!adminWalletAddress) {
      return res.status(500).json({
        success: false,
        message: 'Admin wallet address not configured'
      });
    }

    // Get admin settings to get partner wallets
    const adminSettings = await AdminSettings.findOne();

    // Get fee totals
    const feeAggregation = await Transaction.aggregate([
      { $match: { type: 'fee' } },
      { $group: {
        _id: '$tokenType',
        totalFees: { $sum: '$amount' }
      }}
    ]);

    // Format fee totals
    const feeTotals: Record<string, number> = {};
    feeAggregation.forEach(item => {
      feeTotals[item._id] = item.totalFees;
    });

    res.status(200).json({
      success: true,
      adminWallet: {
        address: adminWalletAddress,
        feeTotals
      },
      partnerWallets: adminSettings?.partnerWallets || [],
      feeSettings: {
        creationFeePercentage: adminSettings?.creationFeePercentage || 10,
        resolutionFeePercentage: adminSettings?.resolutionFeePercentage || 5,
        referralRewardPercentage: adminSettings?.referralRewardPercentage || 2
      }
    });
  } catch (error) {
    console.error('Error getting admin wallet information:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get dashboard stats for sub-admin
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const predictionCount = await Prediction.countDocuments();
    const activeCount = await Prediction.countDocuments({ status: 'active' });
    const resolvedCount = await Prediction.countDocuments({ status: 'resolved' });
    const transactionCount = await Transaction.countDocuments();

    // Get total volume
    const volumeAggregation = await Prediction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$volume' } } }
    ]);
    const totalVolume = volumeAggregation.length > 0 ? volumeAggregation[0].totalVolume : 0;

    // Get fee totals
    const feeAggregation = await Transaction.aggregate([
      { $match: { type: 'fee' } },
      { $group: {
        _id: '$tokenType',
        totalFees: { $sum: '$amount' }
      }}
    ]);

    // Format fee totals
    const feeTotals: Record<string, number> = {};
    feeAggregation.forEach(item => {
      feeTotals[item._id] = item.totalFees;
    });

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        predictionCount,
        activeCount,
        resolvedCount,
        transactionCount,
        totalVolume,
        feeTotals
      }
    });
  } catch (error) {
    console.error('Error getting sub-admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

export default router;
