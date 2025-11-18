import express, { Request, Response, NextFunction } from 'express';
import {
  deleteComment
} from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected
router.use(protect);

router.delete('/:id', asyncHandler(deleteComment));

export default router;
