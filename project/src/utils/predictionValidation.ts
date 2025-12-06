/**
 * Validation utilities for prediction creation
 * Ensures predictions have all required fields and proper formatting
 */

export interface PredictionValidationError {
  field: string;
  message: string;
}

export interface PredictionData {
  title: string;
  description: string;
  type: 'binary' | 'multiple' | 'multi-choice';
  category?: 'crypto' | 'sports';
  asset: string;
  targetPrice?: number | string;
  priceRanges?: string[];
  endDate: string;
  resolveDetails: string;
  stakeAmount?: number;
}

/**
 * Validate prediction data before submission
 */
export function validatePrediction(data: PredictionData): PredictionValidationError[] {
  const errors: PredictionValidationError[] = [];

  // Title validation
  if (!data.title || data.title.trim().length < 10) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 10 characters long'
    });
  }

  // For crypto binary predictions, validate title includes price or clear question
  if (data.category === 'crypto' && data.type === 'binary') {
    const hasPrice = /\$[\d,]+/.test(data.title);
    const hasQuestion = /will|reach|above|below|higher|lower/i.test(data.title);
    if (!hasPrice && !hasQuestion) {
      errors.push({
        field: 'title',
        message: 'Crypto binary prediction title must include a target price (e.g., "$100,000") or a clear question (e.g., "Will BTC reach...")'
      });
    }
  }

  // Description validation
  if (!data.description || data.description.trim().length < 20) {
    errors.push({
      field: 'description',
      message: 'Description must be at least 20 characters long'
    });
  }

  // Resolution details validation
  if (!data.resolveDetails || data.resolveDetails.trim().length < 20) {
    errors.push({
      field: 'resolveDetails',
      message: 'Resolution details must be at least 20 characters long and explain how the prediction will be resolved'
    });
  }

  // End date validation
  const endDate = new Date(data.endDate);
  if (isNaN(endDate.getTime())) {
    errors.push({
      field: 'endDate',
      message: 'Invalid end date'
    });
  } else if (endDate <= new Date()) {
    errors.push({
      field: 'endDate',
      message: 'End date must be in the future'
    });
  }

  // Sports predictions CANNOT be binary (must account for draws)
  if (data.category === 'sports' && data.type === 'binary') {
    errors.push({
      field: 'type',
      message: 'Sports predictions cannot be binary (YES/NO). Use multiple-choice to account for draws (Home Win, Draw, Away Win).'
    });
  }

  // Type-specific validation
  if (data.type === 'binary') {
    // For crypto binary predictions, require target price
    if (data.category === 'crypto') {
      const targetPrice = typeof data.targetPrice === 'string'
        ? parseFloat(data.targetPrice)
        : data.targetPrice;

      if (!targetPrice || targetPrice <= 0) {
        errors.push({
          field: 'targetPrice',
          message: 'Target price is required for crypto binary predictions and must be greater than 0'
        });
      }
    }
  } else if (data.type === 'multiple' || data.type === 'multi-choice') {
    // For multiple choice predictions, require appropriate choices
    if (data.category === 'crypto') {
      if (!data.priceRanges || data.priceRanges.length < 2) {
        errors.push({
          field: 'priceRanges',
          message: 'At least 2 price ranges are required for multiple-choice crypto predictions'
        });
      }
    } else if (data.category === 'sports') {
      // Sports predictions should have 3 choices: Home Win, Draw, Away Win
      // This is validated on the backend, but we can add a helpful message here
    }
  }

  // Asset validation
  if (!data.asset || data.asset.trim().length === 0) {
    errors.push({
      field: 'asset',
      message: 'Asset is required'
    });
  }

  return errors;
}

/**
 * Generate a helpful title suggestion for crypto predictions
 */
export function generateTitleSuggestion(
  asset: string,
  type: 'binary' | 'multiple',
  targetPrice?: number,
  duration?: number
): string {
  const hours = duration ? Math.round(duration / 60) : 24;
  
  if (type === 'binary' && targetPrice) {
    return `Will ${asset} reach $${targetPrice.toLocaleString()} in ${hours} hours?`;
  } else {
    return `Where will ${asset} price be in ${hours} hours?`;
  }
}

/**
 * Generate resolution details suggestion
 */
export function generateResolveDetailsSuggestion(
  asset: string,
  type: 'binary' | 'multiple',
  targetPrice?: number
): string {
  if (type === 'binary' && targetPrice) {
    return `Resolved based on CoinGecko ${asset} price at end time. YES if price >= $${targetPrice.toLocaleString()}, NO otherwise.`;
  } else {
    return `Resolved based on CoinGecko ${asset} price at end time. The winning option will be the price range that contains the final price.`;
  }
}

