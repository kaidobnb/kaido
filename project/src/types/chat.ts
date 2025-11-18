// Chat message types
export interface SolyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Prediction creation flow states
export type PredictionCreationState =
  | 'idle'                // Not creating a prediction
  | 'category_selection'  // Selecting prediction category (crypto or sports)
  | 'asset_selection'     // Selecting the asset (BTC, ETH, etc.)
  | 'type_selection'      // Selecting prediction type (binary or multi-choice)
  | 'target_price'        // Setting target price (for binary)
  | 'price_ranges'        // Setting price ranges (for multi-choice)
  | 'duration_selection'  // Setting prediction duration
  | 'expiry_date'         // Setting expiry date (legacy, now using duration)
  | 'stake_amount'        // Setting stake amount
  | 'confirmation'        // Final confirmation before payment
  | 'payment'             // Processing payment
  | 'complete'            // Prediction created
  // Sports prediction states
  | 'sports_competition'  // Selecting sports competition/league
  | 'sports_match'        // Selecting specific match
  | 'sports_prediction_type' // Selecting sports prediction type
  | 'sports_confirmation'; // Final confirmation for sports prediction

// Prediction parameters collected during chat
export interface ChatPredictionParams {
  category?: 'crypto' | 'sports';
  asset?: string;
  type?: 'binary' | 'multi-choice';
  targetPrice?: string;
  priceRanges?: string[];
  expiryDate?: string;
  duration?: number; // Duration in minutes
  stakeAmount?: number;
  stakeToken?: 'SOL' | 'BNB';
  // Sports-specific parameters
  competitionId?: string;
  competitionName?: string;
  matchId?: string;
  matchTitle?: string;
  homeTeam?: string;
  awayTeam?: string;
  scheduledDate?: string;
}

// Chat context for prediction creation
export interface ChatContext {
  creatingPrediction: boolean;
  predictionState: PredictionCreationState;
  predictionParams: ChatPredictionParams;
}
