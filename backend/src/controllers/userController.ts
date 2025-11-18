import { Request, Response } from 'express';
import User, { IUser, IUserBase } from '../models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Define a user response type for consistent API responses
interface UserResponse {
  id: string;
  walletAddress: string;
  username: string | null;
  email: string | null;
  displayName?: string;
  profileCompleted: boolean;
  avatar?: string;
  bio?: string;
  balances?: {
    SOL: number;
    SOLY: number;
  };
  reputation?: number;
  winRate?: number;
  totalPredictions?: number;
  wonPredictions?: number;
  referralCode?: string;
  referredBy?: string;
  isAdmin?: boolean;
}

// Helper function to format user document to response object
const formatUserResponse = (user: any): UserResponse => {
  console.log('Formatting user response from:', user);
  // Explicitly check if profileCompleted is true
  const profileCompleted = user.profileCompleted === true;
  console.log('Profile completed status:', profileCompleted);

  return {
    id: user._id ? user._id.toString() : '',
    walletAddress: user.walletAddress || '',
    username: user.username || null,
    email: user.email || null,
    displayName: user.displayName || '',
    profileCompleted: profileCompleted,
    avatar: user.avatar || '',
    bio: user.bio || '',
    balances: user.balances || { SOL: 0, SOLY: 0 },
    reputation: user.reputation || 0,
    winRate: user.winRate || 0,
    totalPredictions: user.totalPredictions || 0,
    wonPredictions: user.wonPredictions || 0,
    referralCode: user.referralCode || null,
    referredBy: user.referredBy ? user.referredBy.toString() : null,
    isAdmin: user.isAdmin || false,
  };
};

// Generate JWT token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

// @desc    Log wallet connection
// @route   POST /api/users/connect
// @access  Public
export const logWalletConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received wallet connection request:', req.body);
    const { walletAddress } = req.body;

    if (!walletAddress) {
      console.log('No wallet address provided');
      res.status(400).json({ success: false, message: 'Wallet address is required' });
      return;
    }

    // Check if user exists
    console.log('Checking if user exists with wallet address:', walletAddress);
    let user = await User.findOne({ walletAddress });
    console.log('User search result:', user ? 'Found' : 'Not found');

    if (user) {
      console.log('User found:', user);
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
      console.log('User updated with new login time');
    } else {
      console.log('User not found, creating new user with wallet address:', walletAddress);
      try {
        // Create new user with default values
        user = await User.create({
          walletAddress,
          lastLogin: new Date(),
          profileCompleted: false,
          balances: {
            SOL: 0,
            SOLY: 100 // Give new users some SOLY tokens to start with
          },
          reputation: 0,
          winRate: 0,
          totalPredictions: 0,
          wonPredictions: 0,
          totalVolume: 0
        });
        console.log('New user created successfully:', user);
      } catch (createError) {
        console.error('Error creating new user:', createError);
        throw createError; // Re-throw to be caught by the outer try-catch
      }
    }

    // Generate token
    const userId = user._id ? user._id.toString() : user.id || '';
    console.log('User ID for token generation:', userId);
    const token = generateToken(userId);
    console.log('Generated token for user:', token ? 'Token generated successfully' : 'Token generation failed');

    // Format user response
    const userResponse = formatUserResponse(user);
    console.log('Formatted user response:', userResponse);

    // Send response
    console.log('Sending successful response with token and user data');
    res.status(200).json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Error logging wallet connection:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, displayName, bio, avatar } = req.body;
    const userId = req.user?.id;

    // Allow updating any of the profile fields
    if (!username && !email && !displayName && !bio && avatar === undefined) {
      res.status(400).json({ success: false, message: 'At least one profile field is required for update' });
      return;
    }

    // Check if username is already taken
    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        res.status(400).json({ success: false, message: 'Username is already taken' });
        return;
      }
    }

    // Check if email is already taken
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        res.status(400).json({ success: false, message: 'Email is already taken' });
        return;
      }
    }

    // Update user profile
    const updateData: Partial<IUserBase> = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    updateData.profileCompleted = true;

    console.log('Updating user profile with data:', updateData);

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Format user response
    const userResponse = formatUserResponse(user);

    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    console.log('Getting user profile for userId:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found with ID:', userId);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    console.log('User found:', {
      id: user._id,
      hasReferralCode: !!user.referralCode,
      hasReferredBy: !!user.referredBy,
      referredBy: user.referredBy ? user.referredBy.toString() : null,
      isAdmin: user.isAdmin
    });

    // Format user response
    const userResponse = formatUserResponse(user);

    console.log('Formatted user response:', {
      id: userResponse.id,
      hasReferralCode: !!userResponse.referralCode,
      hasReferredBy: !!userResponse.referredBy,
      referredBy: userResponse.referredBy,
      isAdmin: userResponse.isAdmin
    });

    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get notifications from user document
    const notifications = user.notifications || [];

    // Sort notifications by timestamp (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });

    res.status(200).json({
      success: true,
      notifications: sortedNotifications,
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    // Update the notification
    const result = await User.updateOne(
      {
        _id: userId,
        'notifications._id': notificationId
      },
      {
        $set: { 'notifications.$.read': true }
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Update all notifications for the user
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: { 'notifications.$[].read': true }
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
