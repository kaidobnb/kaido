import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import {
  getCompetitions,
  getMatchesByCompetition,
  getMatchDetails,
  createSportsPrediction,
  getSportsPredictions,
  resolveSportsPrediction,
  getSportsApiProvider,
  setSportsApiProvider,
  clearSportsApiCache
} from '../controllers/adminSportsController';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

// @desc    Get all available competitions/leagues
// @route   GET /api/admin/sports/competitions
// @access  Admin only
router.get('/competitions', getCompetitions as any);

// @desc    Get upcoming matches for a specific competition
// @route   GET /api/admin/sports/competitions/:competitionId/matches
// @access  Admin only
router.get('/competitions/:competitionId/matches', getMatchesByCompetition as any);

// @desc    Get detailed information about a specific match
// @route   GET /api/admin/sports/matches/:matchId
// @access  Admin only
router.get('/matches/:matchId', getMatchDetails as any);

// @desc    Create a new sports prediction
// @route   POST /api/admin/sports/predictions
// @access  Admin only
router.post('/predictions', createSportsPrediction as any);

// @desc    Get all sports predictions (for admin management)
// @route   GET /api/admin/sports/predictions
// @access  Admin only
router.get('/predictions', getSportsPredictions as any);

// @desc    Manually resolve a sports prediction
// @route   POST /api/admin/sports/predictions/:predictionId/resolve
// @access  Admin only
router.post('/predictions/:predictionId/resolve', resolveSportsPrediction as any);

// @desc    Get current sports API provider info
// @route   GET /api/admin/sports/provider
// @access  Admin only
router.get('/provider', getSportsApiProvider as any);

// @desc    Set sports API provider
// @route   POST /api/admin/sports/provider
// @access  Admin only
router.post('/provider', setSportsApiProvider as any);

// @desc    Clear sports API caches
// @route   POST /api/admin/sports/clear-cache
// @access  Admin only
router.post('/clear-cache', clearSportsApiCache as any);

export default router;
