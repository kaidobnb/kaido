import express, { Request, Response, NextFunction } from 'express';
import {
  sendMessage,
  getChatHistory,
  getSportsCompetitions,
  getSportsMatches,
  createSportsPredictionFromChat
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected
router.use(protect);

router.post('/message', asyncHandler(sendMessage));
router.get('/history', asyncHandler(getChatHistory));

// Sports prediction endpoints for chat widget
router.get('/sports/competitions', asyncHandler(getSportsCompetitions));
router.get('/sports/competitions/:competitionId/matches', asyncHandler(getSportsMatches));
router.post('/sports/predictions', asyncHandler(createSportsPredictionFromChat));

export default router;
