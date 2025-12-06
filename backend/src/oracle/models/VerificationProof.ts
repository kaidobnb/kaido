import mongoose, { Document, Schema } from 'mongoose';

/**
 * Verification Proof
 * Stores audit trail of all oracle verifications
 */

export interface IVerificationProof extends Document {
  predictionId: mongoose.Types.ObjectId;
  eventType: string; // e.g., "election_result", "movie_award", "product_launch"
  claim: string; // The claim being verified
  
  // Multi-source verification
  sources: Array<{
    sourceId: mongoose.Types.ObjectId;
    sourceName: string;
    url: string;
    scrapedAt: Date;
    html?: string; // Store raw HTML for audit
    screenshot?: string; // Base64 screenshot
    extractedData: any;
    aiConfidence: number; // 0-100
    aiReasoning?: string;
    success: boolean;
    error?: string;
  }>;
  
  // Consensus result
  consensus: {
    verified: boolean;
    confidence: number; // 0-100
    agreementPercentage: number; // % of sources that agree
    method: 'unanimous' | 'majority' | 'weighted' | 'manual';
    finalValue: any; // The agreed-upon value
  };
  
  // Resolution
  status: 'pending' | 'verified' | 'disputed' | 'failed';
  resolvedAt?: Date;
  resolvedBy: 'oracle' | 'admin' | 'community';
  
  // Dispute handling
  dispute?: {
    raisedBy: mongoose.Types.ObjectId;
    raisedAt: Date;
    reason: string;
    evidence?: string;
    status: 'open' | 'resolved' | 'rejected';
    resolution?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const VerificationProofSchema: Schema = new Schema(
  {
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    claim: {
      type: String,
      required: true
    },
    sources: [
      {
        sourceId: {
          type: Schema.Types.ObjectId,
          ref: 'OracleSource'
        },
        sourceName: String,
        url: String,
        scrapedAt: Date,
        html: String,
        screenshot: String,
        extractedData: Schema.Types.Mixed,
        aiConfidence: Number,
        aiReasoning: String,
        success: Boolean,
        error: String
      }
    ],
    consensus: {
      verified: {
        type: Boolean,
        required: true
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      agreementPercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      method: {
        type: String,
        enum: ['unanimous', 'majority', 'weighted', 'manual'],
        required: true
      },
      finalValue: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'disputed', 'failed'],
      default: 'pending',
      index: true
    },
    resolvedAt: Date,
    resolvedBy: {
      type: String,
      enum: ['oracle', 'admin', 'community'],
      default: 'oracle'
    },
    dispute: {
      raisedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      raisedAt: Date,
      reason: String,
      evidence: String,
      status: {
        type: String,
        enum: ['open', 'resolved', 'rejected']
      },
      resolution: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
VerificationProofSchema.index({ predictionId: 1, status: 1 });
VerificationProofSchema.index({ eventType: 1, createdAt: -1 });
VerificationProofSchema.index({ 'dispute.status': 1 });

export default mongoose.model<IVerificationProof>('VerificationProof', VerificationProofSchema);

