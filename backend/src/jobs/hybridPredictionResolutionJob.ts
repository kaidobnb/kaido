import { CronJob } from 'cron';
import { checkPriceTargetReached, determinePriceRange, getCurrentPrice } from '../services/cryptoService';
import {
  getActivePredictionIds,
  getPredictionFromContract,
  resolvePredictionOnChain,
  lockPrediction,
  isPredictionLocked,
  getPredictionStatus,
  getOracleBalance,
  isContractServiceConfigured,
} from '../services/contractService';
import Prediction from '../models/Prediction';
import { OracleService } from '../oracle/services/OracleService';

/**
 * Hybrid Prediction Resolution Job
 * 
 * This job works with on-chain smart contracts:
 * 1. Reads active predictions from PredictionFactory contract
 * 2. Fetches resolution data from off-chain APIs (CoinGecko, Sportradar)
 * 3. Submits resolution results to smart contract
 * 4. Smart contract handles fee distribution and winner payouts
 */
export const hybridPredictionResolutionJob = new CronJob(
  '* * * * *', // Run every minute
  async function() {
    try {
      // Check if contract service is configured
      if (!isContractServiceConfigured()) {
        console.warn('⚠️  Contract service not configured. Skipping hybrid resolution job.');
        return;
      }

      console.log('🔄 Running hybrid prediction resolution job...');

      // Check oracle balance
      const balance = await getOracleBalance();
      console.log(`   Oracle balance: ${balance} BNB`);

      if (parseFloat(balance) < 0.01) {
        console.warn('⚠️  Oracle balance low! Please fund oracle wallet.');
      }

      // Get all active prediction IDs from smart contract
      const activePredictionIds = await getActivePredictionIds();
      console.log(`   Found ${activePredictionIds.length} active predictions on-chain`);

      const now = Math.floor(Date.now() / 1000);

      // Process each active prediction
      for (const predictionId of activePredictionIds) {
        try {
          // Get prediction details from contract
          const prediction = await getPredictionFromContract(predictionId);
          
          const title = prediction[0] as string;
          const description = prediction[1] as string;
          const predictionType = prediction[2] as number; // 0 = BINARY, 1 = MULTIPLE
          const category = prediction[3] as number; // 0 = CRYPTO, 1 = SPORTS
          const asset = prediction[4] as string;
          const targetPrice = Number(prediction[5]) / 100000000; // Convert from 8 decimals
          const createdAt = Number(prediction[6]);
          const endDate = Number(prediction[7]);
          const lockTime = Number(prediction[8]);
          const totalPool = prediction[9];
          const status = prediction[10]; // 0 = ACTIVE, 1 = LOCKED, 2 = RESOLVED, 3 = CANCELLED

          console.log(`\n📊 Prediction ${predictionId}: ${title}`);
          console.log(`   Category: ${category === 0 ? 'CRYPTO' : 'SPORTS'}`);
          console.log(`   Type: ${predictionType === 0 ? 'BINARY' : 'MULTIPLE'}`);
          console.log(`   Asset: ${asset}`);
          console.log(`   End Date: ${new Date(endDate * 1000).toISOString()}`);
          console.log(`   Lock Time: ${new Date(lockTime * 1000).toISOString()}`);
          console.log(`   Status: ${status}`);

          // Skip if already resolved
          if (status === 2) {
            console.log(`   ⏭️  Already resolved, skipping`);
            continue;
          }

          // Check if prediction should be locked (for sports at kickoff)
          if (category === 1 && status === 0 && now >= lockTime) {
            console.log(`   🔒 Locking sports prediction at kickoff...`);
            try {
              await lockPrediction(predictionId);
              console.log(`   ✅ Prediction locked`);
            } catch (error) {
              console.error(`   ❌ Error locking prediction:`, error);
            }
            continue; // Don't resolve yet, just lock
          }

          // Check if prediction has expired and should be resolved
          if (now < endDate) {
            console.log(`   ⏳ Not expired yet, skipping`);
            continue;
          }

          // Check if prediction is locked (required before resolution)
          const isLocked = await isPredictionLocked(predictionId);
          if (!isLocked) {
            console.log(`   ⚠️  Prediction expired but not locked, locking now...`);
            try {
              await lockPrediction(predictionId);
              console.log(`   ✅ Prediction locked`);
            } catch (error) {
              console.error(`   ❌ Error locking prediction:`, error);
              continue;
            }
          }

          console.log(`   🎯 Resolving prediction...`);

          let resolvedChoice: string | null = null;
          let finalPrice = 0;

          // Check if this is a real-world event prediction (requires oracle)
          const dbPrediction = await Prediction.findOne({ contractAddress: predictionId });

          if (dbPrediction?.category === 'realworld' && dbPrediction.oracleData?.requiresOracle) {
            console.log(`   🔮 Using oracle for real-world event verification...`);

            try {
              const oracle = new OracleService(process.env.OPENAI_API_KEY!);

              const oracleResult = await oracle.verifyEvent({
                predictionId: String(dbPrediction._id),
                eventType: dbPrediction.oracleData.eventType,
                claim: dbPrediction.oracleData.claim,
                schema: dbPrediction.oracleData.schema!,
                minimumSources: 3,
                minimumConfidence: 70,
                minimumAgreement: 66,
              });

              if (oracleResult.success && oracleResult.verified) {
                resolvedChoice = 'YES'; // Claim verified
                console.log(`   ✅ Oracle verified claim with ${oracleResult.confidence}% confidence`);

                // Store proof ID
                await Prediction.findByIdAndUpdate(dbPrediction._id, {
                  'oracleData.verificationProofId': oracleResult.proofId,
                });
              } else {
                resolvedChoice = 'NO'; // Claim not verified
                console.log(`   ❌ Oracle could not verify claim (confidence: ${oracleResult.confidence}%)`);
              }
            } catch (error) {
              console.error(`   ❌ Oracle verification failed:`, error);
              // Default to NO if oracle fails
              resolvedChoice = 'NO';
            }
          }
          // Crypto predictions
          else if (category === 0) {
            if (predictionType === 0) {
              // BINARY prediction
              console.log(`   Checking if ${asset} reached target price $${targetPrice}...`);

              const targetReached = await checkPriceTargetReached(
                asset,
                targetPrice,
                new Date(createdAt * 1000),
                new Date(endDate * 1000)
              );

              resolvedChoice = targetReached ? 'YES' : 'NO';
              finalPrice = await getCurrentPrice(asset);

              console.log(`   Binary prediction resolved as: ${resolvedChoice}`);
              console.log(`   Final price: $${finalPrice}`);
            } else if (predictionType === 1) {
              // MULTIPLE-CHOICE prediction
              console.log(`   Determining price range for ${asset}...`);

              // Get current price at end date
              finalPrice = await getCurrentPrice(asset);

              // For multiple choice, we need to determine which range the price falls into
              // This would require the choices to be stored in the contract
              // For now, we'll skip multiple choice predictions
              console.log(`   ⚠️  Multiple-choice predictions not yet supported in hybrid mode`);
              continue;
            }
          }
          // Sports predictions (category === 1) would be handled here
          else {
            console.log(`   ⚠️  Sports predictions not yet supported in hybrid mode`);
            continue;
          }

          if (resolvedChoice) {
            try {
              console.log(`   📝 Submitting resolution to smart contract...`);
              console.log(`      Winning choice: ${resolvedChoice}`);
              console.log(`      Final price: $${finalPrice}`);

              const txHash = await resolvePredictionOnChain(
                predictionId,
                resolvedChoice,
                finalPrice
              );

              console.log(`   ✅ Prediction ${predictionId} resolved successfully!`);
              console.log(`      Transaction: https://testnet.bscscan.com/tx/${txHash}`);
            } catch (resolveError) {
              console.error(`   ❌ Error submitting resolution to contract:`, resolveError);
            }
          } else {
            console.log(`   ⚠️  Could not determine winning choice, skipping`);
          }
        } catch (error) {
          console.error(`❌ Error processing prediction ${predictionId}:`, error);
        }
      }

      console.log('\n✅ Hybrid prediction resolution job completed\n');
    } catch (error) {
      console.error('❌ Error in hybrid prediction resolution job:', error);
    }
  },
  null, // onComplete
  false, // start
  'UTC' // timezone
);

/**
 * Start the hybrid prediction resolution job
 */
export const startHybridPredictionResolutionJob = () => {
  if (!isContractServiceConfigured()) {
    console.warn('⚠️  Contract service not configured. Hybrid resolution job will not start.');
    console.warn('   Please set ORACLE_PRIVATE_KEY and PREDICTION_FACTORY_ADDRESS in .env');
    return;
  }

  hybridPredictionResolutionJob.start();
  console.log('✅ Hybrid prediction resolution job started');
  console.log('   Job will run every minute to check for expired predictions');
};

