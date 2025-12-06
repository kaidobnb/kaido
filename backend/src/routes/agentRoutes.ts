import express, { Request, Response, RequestHandler } from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import AgentConfig from '../models/AgentConfig';
import kaidoAgentService from '../services/kaidoAgentService';
import {
  getAgentStatus,
  setAgentEnabled,
  restartAgentJobs,
  triggerCreationCycle,
  triggerResolutionCycle
} from '../jobs/kaidoAgentJob';

const router = express.Router();

/**
 * @desc    Get KAIDO Agent status
 * @route   GET /api/agent/status
 * @access  Admin only
 */
const getStatus: RequestHandler = async (req: Request, res: Response) => {
  try {
    const status = await getAgentStatus();
    res.json({ success: true, status });
  } catch (error: any) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get KAIDO Agent configuration
 * @route   GET /api/agent/config
 * @access  Admin only
 */
const getConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const config = await kaidoAgentService.getConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error getting agent config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update KAIDO Agent configuration
 * @route   PUT /api/agent/config
 * @access  Admin only
 */
const updateConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.totalPredictionsCreated;
    delete updates.totalPredictionsResolved;
    delete updates.predictionsCreatedToday;
    
    const config = await AgentConfig.findOneAndUpdate(
      {},
      { ...updates, updatedBy: (req as any).user?._id },
      { new: true, upsert: true }
    );
    
    // Restart jobs if schedule changed
    if (updates.creationCronSchedule || updates.resolutionCronSchedule) {
      await restartAgentJobs();
    }
    
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error updating agent config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Enable/Disable the KAIDO Agent
 * @route   POST /api/agent/toggle
 * @access  Admin only
 */
const toggleAgent: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'enabled must be a boolean' });
      return;
    }
    
    await setAgentEnabled(enabled);
    const status = await getAgentStatus();
    
    res.json({ 
      success: true, 
      message: `KAIDO Agent ${enabled ? 'enabled' : 'disabled'}`,
      status 
    });
  } catch (error: any) {
    console.error('Error toggling agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Pause/Resume the KAIDO Agent
 * @route   POST /api/agent/pause
 * @access  Admin only
 */
const pauseAgent: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { paused } = req.body;
    
    await AgentConfig.findOneAndUpdate({}, { paused }, { upsert: true });
    
    res.json({ 
      success: true, 
      message: `KAIDO Agent ${paused ? 'paused' : 'resumed'}` 
    });
  } catch (error: any) {
    console.error('Error pausing agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually trigger prediction creation
 * @route   POST /api/agent/create
 * @access  Admin only
 */
const manualCreate: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { category } = req.body; // 'crypto' or 'sports'
    
    let prediction;
    if (category === 'crypto') {
      prediction = await kaidoAgentService.createCryptoPrediction();
    } else if (category === 'sports') {
      prediction = await kaidoAgentService.createSportsPrediction();
    } else {
      // Random
      prediction = await triggerCreationCycle();
    }
    
    if (prediction) {
      res.json({ success: true, prediction });
    } else {
      res.json({ success: false, message: 'Could not create prediction (limit reached or no opportunities)' });
    }
  } catch (error: any) {
    console.error('Error in manual create:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually trigger resolution cycle
 * @route   POST /api/agent/resolve
 * @access  Admin only
 */
const manualResolve: RequestHandler = async (req: Request, res: Response) => {
  try {
    await triggerResolutionCycle();
    res.json({ success: true, message: 'Resolution cycle triggered' });
  } catch (error: any) {
    console.error('Error in manual resolve:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// All routes require admin access
router.use(protect as RequestHandler);
router.use(adminOnly as RequestHandler);

router.get('/status', getStatus);
router.get('/config', getConfig);
router.put('/config', updateConfig);
router.post('/toggle', toggleAgent);
router.post('/pause', pauseAgent);
router.post('/create', manualCreate);
router.post('/resolve', manualResolve);

export default router;

