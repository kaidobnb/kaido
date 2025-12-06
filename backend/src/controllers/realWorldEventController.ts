import { Request, Response } from 'express';
import {
  EVENT_CATEGORIES,
  EventCategory,
  generateVerificationSchema,
  validateEventClaim,
} from '../services/realWorldEventService';

/**
 * Get all available event categories
 */
export const getEventCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = Object.entries(EVENT_CATEGORIES).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error getting event categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event categories',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Validate an event claim
 */
export const validateClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, claim } = req.body;

    if (!eventType || !claim) {
      res.status(400).json({
        success: false,
        message: 'Event type and claim are required',
      });
      return;
    }

    if (!EVENT_CATEGORIES[eventType as EventCategory]) {
      res.status(400).json({
        success: false,
        message: 'Invalid event type',
      });
      return;
    }

    const validation = await validateEventClaim(eventType as EventCategory, claim);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Error validating claim:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate claim',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Generate verification schema for a claim
 */
export const generateSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, claim } = req.body;

    if (!eventType || !claim) {
      res.status(400).json({
        success: false,
        message: 'Event type and claim are required',
      });
      return;
    }

    if (!EVENT_CATEGORIES[eventType as EventCategory]) {
      res.status(400).json({
        success: false,
        message: 'Invalid event type',
      });
      return;
    }

    const schema = await generateVerificationSchema(eventType as EventCategory, claim);

    // Get suggested sources for this event type
    const suggestedSources = EVENT_CATEGORIES[eventType as EventCategory].suggestedSources;

    res.json({
      success: true,
      data: {
        schema,
        suggestedSources,
      },
    });
  } catch (error) {
    console.error('Error generating schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate schema',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get example claims for an event type
 */
export const getExampleClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType } = req.params;

    if (!EVENT_CATEGORIES[eventType as EventCategory]) {
      res.status(400).json({
        success: false,
        message: 'Invalid event type',
      });
      return;
    }

    const category = EVENT_CATEGORIES[eventType as EventCategory];

    res.json({
      success: true,
      data: {
        exampleClaim: category.exampleClaim,
        requiredFields: category.requiredFields,
        suggestedSources: category.suggestedSources,
      },
    });
  } catch (error) {
    console.error('Error getting example claims:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get example claims',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

