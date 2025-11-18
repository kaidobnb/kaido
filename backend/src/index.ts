import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import predictionRoutes from './routes/predictionRoutes';
import transactionRoutes from './routes/transactionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import chatRoutes from './routes/chatRoutes';
import referralRoutes from './routes/referralRoutes';
import commentRoutes from './routes/commentRoutes';
import adminRoutes from './routes/adminRoutes';
import adminSportsRoutes from './routes/adminSportsRoutes';
import sportsRoutes from './routes/sportsRoutes';
import subAdminRoutes from './routes/subAdminRoutes';
import badgeRoutes from './routes/badgeRoutes';
import presaleRoutes from './routes/presaleRoutes';
import testRoutes from './routes/testRoutes';
import { startPredictionResolutionJob } from './jobs/predictionResolutionJob';
import { startHybridPredictionResolutionJob } from './jobs/hybridPredictionResolutionJob';
import { startAutoPredictionJob } from './jobs/autoPredictionJob';
import AdminSettings from './models/AdminSettings';
import { protect } from './middleware/authMiddleware';
import { checkAccess } from './middleware/inviteOnlyMiddleware';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://solyonsol.com',
    'https://www.solyonsol.com'
  ],
  credentials: true
}));
// Increase JSON payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
// Increase URL-encoded payload size limit to 50MB
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);

  // Log request headers for debugging
  console.log('[REQUEST HEADERS]', req.headers);

  // Log request body for debugging (if it exists)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[REQUEST BODY]', req.body);
  }

  // Capture the response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[RESPONSE] ${res.statusCode} ${req.method} ${req.url}`);

    // Log response body for debugging (if it's not too large)
    if (body && typeof body === 'string' && body.length < 1000) {
      console.log('[RESPONSE BODY]', body);
    } else {
      console.log('[RESPONSE BODY] (too large to log)');
    }

    return originalSend.call(this, body);
  };

  next();
});



// Routes
// Invite-only access has been removed - all authenticated users now have access
app.use('/api/users', userRoutes);
app.use('/api/predictions', predictionRoutes); // Prediction routes handle their own protection
app.use('/api/transactions', protect, transactionRoutes);
app.use('/api/leaderboard', leaderboardRoutes); // Leaderboard routes handle their own protection
app.use('/api/chat', protect, chatRoutes);
app.use('/api/referrals', referralRoutes); // Some referral routes are public
app.use('/api/comments', protect, commentRoutes);
// Temporarily disabled auth for testing - REMOVE IN PRODUCTION
app.use('/api/admin/sports', adminSportsRoutes);
app.use('/api/sports', sportsRoutes); // Public sports routes
app.use('/api/admin', protect, adminRoutes);
app.use('/api/sub-admin', protect, subAdminRoutes);
app.use('/api/badges', protect, badgeRoutes);
app.use('/api/presale', presaleRoutes); // Presale routes handle their own protection
app.use('/api/test', testRoutes); // Test routes for admin functions

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'KAIDO API is running',
    version: '1.0.0',
    endpoints: [
      '/api/users',
      '/api/predictions',
      '/api/transactions',
      '/api/leaderboard',
      '/api/chat',
      '/api/referrals',
      '/api/comments',
      '/api/admin',
      '/api/admin/sports',
      '/api/sub-admin',
      '/api/badges',
      '/api/presale'
    ]
  });
});



// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Start the hybrid prediction resolution job (for smart contracts)
  console.log('\n🔗 Starting Hybrid Prediction Resolution Job...');
  startHybridPredictionResolutionJob();

  // Also start the legacy prediction resolution job (for MongoDB-based predictions)
  console.log('\n📊 Starting Legacy Prediction Resolution Job...');
  startPredictionResolutionJob();

  // Check if auto-prediction is enabled and start the job if needed
  try {
    const adminSettings = await AdminSettings.findOne({});
    if (adminSettings && adminSettings.autoPredictionEnabled) {
      startAutoPredictionJob();
      console.log('Auto-prediction job started (enabled in settings)');
    } else {
      console.log('Auto-prediction job not started (disabled in settings)');
    }
  } catch (error) {
    console.error('Error checking auto-prediction settings:', error);
  }
});
