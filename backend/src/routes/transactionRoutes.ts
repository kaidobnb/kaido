import express, { Request, Response, NextFunction } from 'express';
import {
  getUserTransactions,
  depositFunds,
  withdrawFunds,
  getPortfolioSummary
} from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected
router.use(protect);

router.get('/', asyncHandler(getUserTransactions));
router.post('/deposit', asyncHandler(depositFunds));
router.post('/withdraw', asyncHandler(withdrawFunds));
router.get('/portfolio', asyncHandler(getPortfolioSummary));

export default router;
