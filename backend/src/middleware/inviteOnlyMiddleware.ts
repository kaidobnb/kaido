import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';

/**
 * Middleware to check if a referral code is valid
 * This is used for the invite-only system
 */
export const checkReferralCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
      return;
    }

    // Check if the referral code exists in the database
    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        isValid: false
      });
      return;
    }

    // Referral code is valid
    res.status(200).json({
      success: true,
      message: 'Valid referral code',
      isValid: true,
      referrer: {
        username: referrer.username || 'Anonymous',
        avatar: referrer.avatar || ''
      }
    });
  } catch (error) {
    console.error('Error checking referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      isValid: false
    });
  }
};

/**
 * Middleware to check if a user has access to the platform
 * NOTE: Invite-only access has been removed - all users now have access
 */
export const checkAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in request (should be added by protect middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, no user found',
        accessDenied: true
      });
      return;
    }

    // User has access, proceed
    next();
    return;

  } catch (error) {
    console.error('Error in access middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      accessDenied: true
    });
  }
};
