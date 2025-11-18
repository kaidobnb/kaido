import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        return;
      }

      // Add user to request with explicit id property
      req.user = {
        id: user._id ? user._id.toString() : '',
        _id: user._id, // Include the MongoDB _id object
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        profileCompleted: user.profileCompleted,
        isAdmin: user.isAdmin || false,
        isSubAdmin: user.isSubAdmin || false,
        balances: user.balances || { SOL: 0, SOLY: 0 } // Include balances
      };

      next();
    } catch (error) {
      console.error('Error in auth middleware:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
