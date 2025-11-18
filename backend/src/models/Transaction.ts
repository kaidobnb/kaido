import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'prediction' | 'win' | 'loss' | 'referral' | 'referral_claim' | 'fee' | 'refund' | 'presale';
  amount: number;
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  prediction?: mongoose.Types.ObjectId;
  referredUser?: mongoose.Types.ObjectId; // Added field to track which user generated the referral reward
  position?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'pending_admin';
  txHash?: string;
  description?: string;
  toWallet?: string;
  fromWallet?: string;
  adminApproved?: boolean;
  metadata?: {
    transactionIds?: string[];
    claimedAt?: Date;
    [key: string]: any;
  };
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'prediction', 'win', 'loss', 'referral', 'referral_claim', 'fee', 'refund', 'presale'],
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
    prediction: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction',
    },
    referredUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    position: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'pending_admin'],
      default: 'completed',
    },
    txHash: {
      type: String,
    },
    description: {
      type: String,
    },
    toWallet: {
      type: String,
    },
    fromWallet: {
      type: String,
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
