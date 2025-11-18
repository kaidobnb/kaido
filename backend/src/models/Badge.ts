import mongoose, { Document, Schema } from 'mongoose';

export interface IBadgeBase {
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'participation' | 'special' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirements: {
    type: string;
    threshold: number;
    timeframe?: number; // in days, if applicable
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBadge extends Document, IBadgeBase {}

const BadgeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['achievement', 'participation', 'special', 'milestone'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      required: true,
    },
    requirements: {
      type: {
        type: String,
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      },
      timeframe: {
        type: Number,
        required: false,
      },
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBadge>('Badge', BadgeSchema);
