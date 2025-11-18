import express, { Request, Response, NextFunction } from 'express';
import {
  getPresaleConfig,
  participateInPresale,
  getPresaleHistory
} from '../controllers/presaleController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.get('/config', asyncHandler(getPresaleConfig));

// Protected routes
router.post('/participate', protect, asyncHandler(participateInPresale));
router.get('/history', protect, asyncHandler(getPresaleHistory));

export default router;
