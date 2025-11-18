import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referred: mongoose.Types.ObjectId;
  status: 'pending' | 'active';
  hasPredicted: boolean; // Track if the referred user has made a prediction
  rewards: {
    SOL?: number;
    BNB?: number;
    KAIDO?: number;
  };
  createdAt: Date;
}

const ReferralSchema: Schema = new Schema(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referred: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
    },
    hasPredicted: {
      type: Boolean,
      default: false,
    },
    rewards: {
      SOL: {
        type: Number,
        default: 0,
      },
      BNB: {
        type: Number,
        default: 0,
      },
      KAIDO: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IReferral>('Referral', ReferralSchema);
