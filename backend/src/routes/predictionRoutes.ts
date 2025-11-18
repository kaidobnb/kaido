import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  participateInPrediction,
  resolvePrediction,
  getUserPredictions,
  claimWinnings,
  getClaimableWinnings,
  getClaimableCreatorFees,
  claimCreatorFees,
  getPredictionVotes,
  getPredictionWinners
} from '../controllers/predictionFunctions';
import {
  addComment,
  getComments
} from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Wrapper function to handle async errors with logging
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  console.log(`[ROUTE] ${req.method} ${req.originalUrl}`);
  Promise.resolve(fn(req, res, next))
    .catch(err => {
      console.error(`[ROUTE ERROR] ${req.method} ${req.originalUrl}:`, err);
      next(err);
    });
};

// Winnings routes - these need to be defined first to avoid conflicts with /:id routes
router.get('/claimable', protect, asyncHandler(getClaimableWinnings));
router.post('/claim/:id', protect, asyncHandler(claimWinnings));

// Creator fees routes
router.get('/claimable-creator-fees', protect, asyncHandler(getClaimableCreatorFees));
router.post('/claim-creator-fees', protect, asyncHandler(claimCreatorFees));

// Protected routes with specific paths
router.get('/user/predictions', protect, asyncHandler(getUserPredictions));

// Debug route
router.get('/debug', (req: Request, res: Response) => {
  console.log('[DEBUG] Received request for debug');
  res.json({
    success: true,
    message: 'Debug route is working',
    route: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.get('/', asyncHandler(getPredictions));

// Routes with parameters - these need to be defined last
router.get('/:id', asyncHandler(getPredictionById));
router.get('/:id/comments', asyncHandler(getComments));
router.get('/:id/votes', asyncHandler(getPredictionVotes));
router.get('/:id/winners', asyncHandler(getPredictionWinners));
router.post('/:id/participate', protect, asyncHandler(participateInPrediction));
router.post('/:id/resolve', protect, asyncHandler(resolvePrediction));
router.post('/:id/comments', protect, asyncHandler(addComment));

// Other protected routes
router.post('/', protect, asyncHandler(createPrediction));

// Update prediction percentages route (migrated from JS version)
router.post('/:id/update-percentages', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { choices } = req.body;

    if (!choices || !Array.isArray(choices)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid choices data'
      });
    }

    // Find the prediction
    const prediction = await mongoose.model('Prediction').findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Update the prediction choices
    prediction.choices = choices;
    await prediction.save();

    return res.status(200).json({
      success: true,
      message: 'Prediction percentages updated successfully'
    });
  } catch (error) {
    console.error('Error updating prediction percentages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

export default router;
