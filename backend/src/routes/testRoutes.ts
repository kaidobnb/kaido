import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import { autoPredictionJob } from '../jobs/autoPredictionJob';

const router = express.Router();

// Test endpoint to manually trigger auto-prediction creation
router.post('/trigger-auto-predictions', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Manually triggering auto-prediction creation...');
    
    // Manually fire the auto-prediction job
    await autoPredictionJob.fireOnTick();
    
    res.status(200).json({
      success: true,
      message: 'Auto-prediction creation triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering auto-prediction creation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto-prediction creation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
