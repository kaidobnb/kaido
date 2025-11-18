import mongoose from 'mongoose';

// Interface for partner wallet configuration
export interface IPartnerWallet {
  walletAddress: string;
  feePercentage: number; // Percentage of the 10% creation fee (e.g., 20 means 20% of the 10% fee)
  name?: string;
  active: boolean;
}

export interface IAdminSettings extends mongoose.Document {
  autoApproveClaims: boolean;
  lastUpdated: Date;
  updatedBy?: mongoose.Types.ObjectId;
  // Fee settings
  creationFeePercentage: number; // Default 10%
  resolutionFeePercentage: number; // Default 5%
  creatorSharePercentage: number; // Default 20% of resolution fee (1% of total pool)
  referralRewardPercentage: number; // Default 2% - percentage of user stake that goes to referrers
  // Partner wallet settings
  partnerWallets: IPartnerWallet[];
  // Auto-prediction settings
  autoPredictionEnabled: boolean; // Enable/disable auto-prediction creation
  maxActivePredictions: number; // Maximum number of active predictions to maintain
  predictionsPerBatch: number; // Number of predictions to create per batch
  autoPredictionInterval: string; // Cron expression for auto-prediction frequency
}

const PartnerWalletSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  },
  feePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Maximum 100% of the creation fee
  },
  name: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
});

const AdminSettingsSchema = new mongoose.Schema(
  {
    autoApproveClaims: {
      type: Boolean,
      default: false,
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Fee settings
    creationFeePercentage: {
      type: Number,
      default: 10, // 10% creation fee
      min: 0,
      max: 100
    },
    resolutionFeePercentage: {
      type: Number,
      default: 5, // 5% resolution fee
      min: 0,
      max: 100
    },
    creatorSharePercentage: {
      type: Number,
      default: 20, // 20% of resolution fee goes to creator (1% of total pool)
      min: 0,
      max: 100
    },
    referralRewardPercentage: {
      type: Number,
      default: 2, // 2% referral reward percentage
      min: 0,
      max: 100
    },
    // Partner wallet settings
    partnerWallets: {
      type: [PartnerWalletSchema],
      default: []
    },
    // Auto-prediction settings
    autoPredictionEnabled: {
      type: Boolean,
      default: false
    },
    maxActivePredictions: {
      type: Number,
      default: 20,
      min: 1,
      max: 100
    },
    predictionsPerBatch: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    autoPredictionInterval: {
      type: String,
      default: '0 */6 * * *' // Every 6 hours
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
