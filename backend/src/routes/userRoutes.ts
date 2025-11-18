import express, { Request, Response, NextFunction } from 'express';
import {
  logWalletConnection,
  updateUserProfile,
  getUserProfile,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.post('/connect', asyncHandler(logWalletConnection));

// Protected routes
router.route('/profile')
  .get(protect, asyncHandler(getUserProfile))
  .put(protect, asyncHandler(updateUserProfile));

// Notification routes
router.get('/notifications', protect, asyncHandler(getUserNotifications));
router.put('/notifications/:id/read', protect, asyncHandler(markNotificationAsRead));
router.put('/notifications/read-all', protect, asyncHandler(markAllNotificationsAsRead));

export default router;
