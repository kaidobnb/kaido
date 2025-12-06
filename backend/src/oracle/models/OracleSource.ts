import mongoose, { Document, Schema } from 'mongoose';

/**
 * Trusted Source Registry
 * Maintains a list of trusted sources for different event types
 */

export interface IOracleSource extends Document {
  name: string;
  domain: string;
  category: 'news' | 'government' | 'sports' | 'finance' | 'entertainment' | 'technology';
  reputation: number; // 0-100 score
  isActive: boolean;
  scraperType: 'cheerio' | 'puppeteer';
  selectors?: {
    [key: string]: string; // CSS selectors for data extraction
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  metadata?: {
    lastScraped?: Date;
    successRate?: number; // Percentage of successful scrapes
    averageResponseTime?: number; // In milliseconds
    totalScrapes?: number;
    failedScrapes?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OracleSourceSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      enum: ['news', 'government', 'sports', 'finance', 'entertainment', 'technology'],
      required: true
    },
    reputation: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    scraperType: {
      type: String,
      enum: ['cheerio', 'puppeteer'],
      default: 'cheerio'
    },
    selectors: {
      type: Map,
      of: String
    },
    rateLimit: {
      requestsPerMinute: {
        type: Number,
        default: 10
      },
      requestsPerDay: {
        type: Number,
        default: 1000
      }
    },
    metadata: {
      lastScraped: Date,
      successRate: {
        type: Number,
        default: 100
      },
      averageResponseTime: Number,
      totalScrapes: {
        type: Number,
        default: 0
      },
      failedScrapes: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
OracleSourceSchema.index({ category: 1, isActive: 1 });
OracleSourceSchema.index({ domain: 1 });

export default mongoose.model<IOracleSource>('OracleSource', OracleSourceSchema);

