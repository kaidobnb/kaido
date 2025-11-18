import mongoose, { Document, Schema } from 'mongoose';
import { IPrediction } from './Prediction';

export interface IParticipation extends Document {
  user: mongoose.Types.ObjectId;
  prediction: mongoose.Types.ObjectId | IPrediction;
  position: string;
  amount: number;
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  status: 'active' | 'won' | 'lost' | 'refunded';
  reward?: number;
  claimable?: boolean;
  claimed?: boolean;
  claimedAt?: Date;
  adminApproved?: boolean;
  createdAt: Date;
}

const ParticipationSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prediction: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction',
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tokenType: {
      type: String,
      enum: ['SOL', 'SOLY', 'BNB', 'KAIDO'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'won', 'lost', 'refunded'],
      default: 'active',
    },
    reward: {
      type: Number,
      default: 0,
    },
    claimable: {
      type: Boolean,
      default: false,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    claimedAt: {
      type: Date,
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a non-unique compound index for query performance
ParticipationSchema.index({ user: 1, prediction: 1, position: 1 });

export default mongoose.model<IParticipation>('Participation', ParticipationSchema);
