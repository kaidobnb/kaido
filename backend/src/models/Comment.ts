import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  prediction: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  position?: string;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    prediction: {
      type: Schema.Types.ObjectId,
      ref: 'Prediction',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IComment>('Comment', CommentSchema);
