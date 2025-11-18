import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Prediction from '../models/Prediction';
import { IUser } from '../models/User';

// @desc    Add comment to prediction
// @route   POST /api/predictions/:id/comments
// @access  Private
export const addComment = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { text, position } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Please provide comment text' });
    }

    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Create comment
    const comment = await Comment.create({
      prediction: prediction._id,
      user: user._id,
      text,
      position
    });

    // Populate user data
    await comment.populate('user', 'username avatar');

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a prediction
// @route   GET /api/predictions/:id/comments
// @access  Public
export const getComments = async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get comments for prediction
    const comments = await Comment.find({ prediction: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'username avatar');

    // Get total count for pagination
    const total = await Comment.countDocuments({ prediction: req.params.id });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Owner only)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: { toString(): string } };

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment owner
    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
