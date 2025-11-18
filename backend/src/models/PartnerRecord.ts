import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerTransaction {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
  predictionId?: mongoose.Types.ObjectId;
  predictionTitle?: string;
  status: 'pending' | 'paid';
  txHash?: string;
  paidAt?: Date;
}

export interface IPartnerRecord extends Document {
  partnerId: string; // This is the _id from the partner wallet in AdminSettings
  partnerName: string;
  walletAddress: string;
  totalFees: number;
  pendingFees: number;
  paidFees: number;
  lastPayout: Date | null;
  transactions: IPartnerTransaction[];
}

const PartnerTransactionSchema = new Schema({
  amount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  predictionId: {
    type: Schema.Types.ObjectId,
    ref: 'Prediction'
  },
  predictionTitle: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  txHash: {
    type: String
  },
  paidAt: {
    type: Date
  }
});

const PartnerRecordSchema = new Schema(
  {
    partnerId: {
      type: String,
      required: true
    },
    partnerName: {
      type: String,
      default: 'Unnamed Partner'
    },
    walletAddress: {
      type: String,
      required: true
    },
    totalFees: {
      type: Number,
      default: 0
    },
    pendingFees: {
      type: Number,
      default: 0
    },
    paidFees: {
      type: Number,
      default: 0
    },
    lastPayout: {
      type: Date,
      default: null
    },
    transactions: [PartnerTransactionSchema]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IPartnerRecord>('PartnerRecord', PartnerRecordSchema);
