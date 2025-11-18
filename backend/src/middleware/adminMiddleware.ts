import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const adminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user exists in request (should be added by protect middleware)
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized, no user found' });
      return;
    }

    // Get the full user from the database to check admin status
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    // Define admin wallet addresses
    const adminWallets = [
      process.env.ADMIN_WALLET_ADDRESS,
      '6rzmRYho7VViFwy6scyyfGvNRT6Y7PudPWtAyT5H8QEs', // Original admin wallet
      '0xac01Ee787F54FB1A2D8a08bA597c4b0a75Da83eb'   // New admin wallet
    ].filter(Boolean); // Remove any undefined/empty values

    // Check if user is admin
    if (!user.isAdmin && !adminWallets.includes(user.walletAddress)) {
      res.status(403).json({ success: false, message: 'Not authorized, admin access required' });
      return;
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
