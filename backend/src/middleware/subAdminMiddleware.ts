import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Middleware to check if a user is a sub-admin or admin
export const subAdminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Check if user is admin or sub-admin
    if (!user.isAdmin && !user.isSubAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized, admin or sub-admin access required' });
      return;
    }

    // Add a flag to indicate if the user is a sub-admin (but not a full admin)
    req.user.isSubAdmin = user.isSubAdmin;
    req.user.isAdmin = user.isAdmin;

    // User is admin or sub-admin, proceed
    next();
  } catch (error) {
    console.error('Error in sub-admin middleware:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Middleware to check if a user is a sub-admin only (not a full admin)
// This can be used for routes that should only be accessible to sub-admins
export const subAdminOnlyNotAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Check if user is sub-admin but not admin
    if (!user.isSubAdmin || user.isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized, sub-admin access required' });
      return;
    }

    // User is sub-admin, proceed
    next();
  } catch (error) {
    console.error('Error in sub-admin-only middleware:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
