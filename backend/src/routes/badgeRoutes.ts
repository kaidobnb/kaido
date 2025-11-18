import express, { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllBadges,
  getUserBadges,
  checkForNewBadges,
  markBadgeNotificationsAsRead,
  awardBadge,
} from '../controllers/badgeController';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all badges
router.get('/', protect, asyncHandler(getAllBadges));

// Get user badges
router.get('/user', protect, asyncHandler(getUserBadges));

// Check for new badges
router.get('/check', protect, asyncHandler(checkForNewBadges));

// Mark badge notifications as read
router.post('/read', protect, asyncHandler(markBadgeNotificationsAsRead));

// Award a badge to a user (admin only)
router.post('/award', protect, asyncHandler(awardBadge));

export default router;
