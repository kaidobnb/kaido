import { CronJob } from 'cron';
import Prediction, { IPrediction } from '../models/Prediction';
import Participation, { IParticipation } from '../models/Participation';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Referral from '../models/Referral';
import { checkPriceTargetReached, determinePriceRange, getCurrentPrice } from '../services/cryptoService';
import { resolvePrediction } from '../controllers/predictionController.fixed';
import mongoose from 'mongoose';
import AdminSettings from '../models/AdminSettings';
import * as fs from 'fs';
import * as path from 'path';

// Load KAIDO wallet credentials from wasp.json
let waspWallets: {
  lossEdgePool: { address: string; privateKey: string };
  kaidoTreasury: { address: string; privateKey: string };
} | null = null;

try {
  const waspPath = path.join(__dirname, '..', '..', 'wasp.json');
  if (fs.existsSync(waspPath)) {
    const waspContent = fs.readFileSync(waspPath, 'utf-8');
    waspWallets = JSON.parse(waspContent);
    console.log('✅ Loaded KAIDO wallet credentials from wasp.json');
    console.log(`   Loss Edge Pool: ${waspWallets?.lossEdgePool.address}`);
    console.log(`   KAIDO Treasury: ${waspWallets?.kaidoTreasury.address}`);
  } else {
    console.warn('⚠️  wasp.json not found. Fee distribution to Loss Edge Pool and Treasury will be skipped.');
  }
} catch (error) {
  console.error('❌ Error loading wasp.json:', error);
}

/**
 * Job to automatically resolve predictions that have reached their end date
 * Runs every minute to check for predictions that need to be resolved
 */
export const predictionResolutionJob = new CronJob(
  '* * * * *', // Run every minute
  async function() {
    try {
      console.log('Running prediction resolution job...');

      // Find active predictions that have passed their end date
      const now = new Date();
      const utcNow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      ));

      console.log(`Current UTC time: ${utcNow.toISOString()}`);

      const expiredPredictions = await Prediction.find({
        status: 'active',
        endDate: { $lte: utcNow }
      }) as (mongoose.Document & IPrediction)[];

      console.log(`Found ${expiredPredictions.length} expired predictions to resolve`);

      // Process each expired prediction
      for (const prediction of expiredPredictions) {
        try {
          console.log(`Resolving prediction ${prediction._id} (${prediction.title})`);

          let resolvedChoice: string | null = null;

          // Determine the resolved choice based on prediction type
          if (prediction.type === 'binary') {
            // For binary predictions, check if target price was reached
            const targetReached = await checkPriceTargetReached(
              prediction.asset,
              prediction.targetPrice || 0,
              new Date(prediction.createdAt),
              new Date(prediction.endDate)
            );
            resolvedChoice = targetReached ? 'yes' : 'no';
            console.log(`Binary prediction resolved as: ${resolvedChoice}`);
          } else if (prediction.type === 'multiple' && prediction.priceRanges) {
            // For multiple-choice predictions, determine which price range the asset falls into
            const matchingRange = await determinePriceRange(
              prediction.asset,
              prediction.priceRanges,
              new Date(prediction.endDate)
            );

            if (matchingRange) {
              // Find the choice ID that corresponds to this range
              const matchingChoice = prediction.choices.find(c => c.label === matchingRange);
              if (matchingChoice) {
                resolvedChoice = matchingChoice.id;
                console.log(`Multiple-choice prediction resolved with range: ${matchingRange}, choice: ${resolvedChoice}`);
              }
            }
          }

          if (resolvedChoice) {
            try {
              const predictionId = String(prediction._id);
              console.log(`Resolving prediction ${predictionId} with choice ${resolvedChoice}`);

              // Update prediction status
              await Prediction.findByIdAndUpdate(predictionId, {
                status: 'resolved',
                resolvedChoice,
                resolvedAt: new Date(),
                resolvedBy: 'api'
              });

              // Distribute rewards using the shared service
              const { distributeRewards } = await import('../services/rewardDistributionService');
              await distributeRewards(predictionId, resolvedChoice);

              console.log(`Successfully resolved prediction ${predictionId} and distributed rewards`);
            } catch (resolveError) {
              console.error(`Error calling resolvePrediction for ${prediction._id}:`, resolveError);

              // Fallback to just updating the prediction status
              await Prediction.findByIdAndUpdate(prediction._id, {
                status: 'resolved',
                resolvedChoice,
                resolvedAt: utcNow,
                resolvedBy: 'api'
              });

              console.log(`Fallback: Updated prediction ${prediction._id} status only`);
            }
          } else {
            console.log(`Could not automatically resolve prediction ${prediction._id}, will require admin resolution`);
          }
        } catch (error) {
          console.error(`Error resolving prediction ${prediction._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in prediction resolution job:', error);
    }
  },
  null, // onComplete
  false, // start
  'UTC' // timezone
);

/**
 * Start the prediction resolution job
 */
export const startPredictionResolutionJob = () => {
  predictionResolutionJob.start();
  console.log('Prediction resolution job started');
};
