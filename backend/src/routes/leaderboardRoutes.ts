import express, { Request, Response, NextFunction } from 'express';
import {
  getLeaderboard,
  getUserRank
} from '../controllers/leaderboardController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.get('/', asyncHandler(getLeaderboard));

// Protected routes
router.get('/rank', protect, asyncHandler(getUserRank));

export default router;
