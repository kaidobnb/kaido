import express from 'express';
import {
  getEventCategories,
  validateClaim,
  generateSchema,
  getExampleClaims,
} from '../controllers/realWorldEventController';

const router = express.Router();

/**
 * @route   GET /api/realworld/categories
 * @desc    Get all available event categories
 * @access  Public
 */
router.get('/categories', getEventCategories);

/**
 * @route   POST /api/realworld/validate-claim
 * @desc    Validate an event claim
 * @access  Public
 */
router.post('/validate-claim', validateClaim);

/**
 * @route   POST /api/realworld/generate-schema
 * @desc    Generate verification schema for a claim
 * @access  Public
 */
router.post('/generate-schema', generateSchema);

/**
 * @route   GET /api/realworld/examples/:eventType
 * @desc    Get example claims for an event type
 * @access  Public
 */
router.get('/examples/:eventType', getExampleClaims);

export default router;

