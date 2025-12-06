import mongoose, { Schema, Document } from 'mongoose';

/**
 * KAIDO Agent Configuration Model
 * Stores settings for the autonomous AI agent that creates and resolves predictions
 */

export interface IAgentConfig extends Document {
  // Agent status
  enabled: boolean;
  paused: boolean;
  lastActive: Date;
  
  // Creation settings
  creationEnabled: boolean;
  maxPredictionsPerDay: number;
  predictionsCreatedToday: number;
  lastCreationReset: Date;
  
  // Category settings
  cryptoEnabled: boolean;
  sportsEnabled: boolean;
  
  // Crypto settings
  cryptoAssets: string[]; // e.g., ['BTC', 'ETH', 'BNB', 'SOL']
  cryptoPredictionTypes: ('binary' | 'multiple')[];
  cryptoMinDuration: number; // minutes
  cryptoMaxDuration: number; // minutes
  
  // Sports settings
  sportsCompetitions: string[]; // Competition IDs
  sportsPredictionTypes: ('binary' | 'multiple')[];
  priorityTeams: string[]; // Popular teams to prioritize (e.g., 'Manchester United', 'Barcelona')
  priorityTeamWeight: number; // How much to favor priority teams (1-10)
  
  // Resolution settings
  resolutionEnabled: boolean;
  autoResolveOnChain: boolean;
  
  // AI settings
  openaiModel: string;
  temperature: number;
  
  // Scheduling
  creationCronSchedule: string;
  resolutionCronSchedule: string;
  
  // Tracking
  totalPredictionsCreated: number;
  totalPredictionsResolved: number;
  lastError?: string;
  lastErrorAt?: Date;
  
  // Metadata
  updatedBy?: mongoose.Types.ObjectId;
}

const AgentConfigSchema: Schema = new Schema(
  {
    // Agent status
    enabled: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    
    // Creation settings
    creationEnabled: { type: Boolean, default: true },
    maxPredictionsPerDay: { type: Number, default: 10, min: 1, max: 50 },
    predictionsCreatedToday: { type: Number, default: 0 },
    lastCreationReset: { type: Date, default: Date.now },
    
    // Category settings
    cryptoEnabled: { type: Boolean, default: true },
    sportsEnabled: { type: Boolean, default: true },
    
    // Crypto settings
    cryptoAssets: {
      type: [String],
      default: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX']
    },
    cryptoPredictionTypes: {
      type: [String],
      enum: ['binary', 'multiple'],
      default: ['binary', 'multiple']
    },
    cryptoMinDuration: { type: Number, default: 60 }, // 1 hour
    cryptoMaxDuration: { type: Number, default: 1440 }, // 24 hours
    
    // Sports settings
    sportsCompetitions: {
      type: [String],
      default: [
        'sr:competition:17',  // Premier League
        'sr:competition:34',  // La Liga
        'sr:competition:23',  // Serie A
        'sr:competition:35',  // Bundesliga
        'sr:competition:238'  // Ligue 1
      ]
    },
    sportsPredictionTypes: {
      type: [String],
      enum: ['binary', 'multiple'],
      default: ['binary', 'multiple']
    },
    // Priority teams - popular teams to prioritize for predictions
    priorityTeams: {
      type: [String],
      default: [
        // Premier League
        'Manchester United', 'Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham',
        // La Liga
        'Barcelona', 'Real Madrid', 'Atletico Madrid',
        // Serie A
        'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma',
        // Bundesliga
        'Bayern Munich', 'Borussia Dortmund',
        // Ligue 1
        'Paris Saint-Germain', 'PSG',
        // Other popular
        'Ajax', 'Porto', 'Benfica'
      ]
    },
    priorityTeamWeight: { type: Number, default: 8, min: 1, max: 10 }, // Higher = stronger preference
    
    // Resolution settings
    resolutionEnabled: { type: Boolean, default: true },
    autoResolveOnChain: { type: Boolean, default: true },
    
    // AI settings
    openaiModel: { type: String, default: 'gpt-4o' },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    
    // Scheduling
    creationCronSchedule: { type: String, default: '0 */4 * * *' }, // Every 4 hours
    resolutionCronSchedule: { type: String, default: '* * * * *' }, // Every minute
    
    // Tracking
    totalPredictionsCreated: { type: Number, default: 0 },
    totalPredictionsResolved: { type: Number, default: 0 },
    lastError: { type: String },
    lastErrorAt: { type: Date },
    
    // Metadata
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Ensure only one config document exists
AgentConfigSchema.statics.getConfig = async function(): Promise<IAgentConfig> {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export default mongoose.model<IAgentConfig>('AgentConfig', AgentConfigSchema);

