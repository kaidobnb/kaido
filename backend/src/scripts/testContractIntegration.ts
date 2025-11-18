import dotenv from 'dotenv';
import {
  getActivePredictionIds,
  getPredictionFromContract,
  getPredictionStatus,
  getOracleBalance,
  isContractServiceConfigured,
} from '../services/contractService';

// Load environment variables
dotenv.config();

/**
 * Test script to verify contract integration
 */
async function testContractIntegration() {
  console.log('🧪 Testing Contract Integration...\n');

  // Check configuration
  console.log('1️⃣ Checking configuration...');
  const isConfigured = isContractServiceConfigured();
  console.log(`   Contract service configured: ${isConfigured ? '✅' : '❌'}`);
  
  if (!isConfigured) {
    console.error('\n❌ Contract service not configured!');
    console.error('   Please set the following environment variables:');
    console.error('   - ORACLE_PRIVATE_KEY');
    console.error('   - PREDICTION_FACTORY_ADDRESS');
    process.exit(1);
  }

  // Check oracle balance
  console.log('\n2️⃣ Checking oracle balance...');
  try {
    const balance = await getOracleBalance();
    console.log(`   Oracle balance: ${balance} BNB`);
    
    if (parseFloat(balance) < 0.01) {
      console.warn('   ⚠️  Warning: Oracle balance is low!');
    } else {
      console.log('   ✅ Oracle has sufficient balance');
    }
  } catch (error) {
    console.error('   ❌ Error getting oracle balance:', error);
  }

  // Get active predictions
  console.log('\n3️⃣ Getting active predictions...');
  try {
    const activePredictionIds = await getActivePredictionIds();
    console.log(`   Found ${activePredictionIds.length} active predictions`);
    
    if (activePredictionIds.length === 0) {
      console.log('   ℹ️  No active predictions found');
      console.log('   Create a prediction on-chain to test resolution');
    } else {
      console.log(`   Active prediction IDs: ${activePredictionIds.join(', ')}`);
      
      // Get details for first prediction
      console.log('\n4️⃣ Getting prediction details...');
      const firstPredictionId = activePredictionIds[0];
      
      try {
        const prediction = await getPredictionFromContract(firstPredictionId);
        
        console.log(`\n   📊 Prediction ${firstPredictionId}:`);
        console.log(`      Title: ${prediction[0]}`);
        console.log(`      Description: ${prediction[1]}`);
        console.log(`      Type: ${prediction[2] === 0 ? 'BINARY' : 'MULTIPLE'}`);
        console.log(`      Category: ${prediction[3] === 0 ? 'CRYPTO' : 'SPORTS'}`);
        console.log(`      Asset: ${prediction[4]}`);
        console.log(`      Target Price: $${Number(prediction[5]) / 100000000}`);
        console.log(`      Created At: ${new Date(Number(prediction[6]) * 1000).toISOString()}`);
        console.log(`      End Date: ${new Date(Number(prediction[7]) * 1000).toISOString()}`);
        console.log(`      Lock Time: ${new Date(Number(prediction[8]) * 1000).toISOString()}`);
        console.log(`      Total Pool: ${Number(prediction[9]) / 1e18} BNB`);
        console.log(`      Status: ${['ACTIVE', 'LOCKED', 'RESOLVED', 'CANCELLED'][prediction[10]]}`);
        
        // Get prediction status
        const status = await getPredictionStatus(firstPredictionId);
        console.log(`\n   📈 Status Details:`);
        console.log(`      Is Locked: ${status.isLocked ? '🔒 Yes' : '🔓 No'}`);
        console.log(`      Is Resolved: ${status.isResolved ? '✅ Yes' : '⏳ No'}`);
        console.log(`      Total Pool: ${status.totalPool} BNB`);
        if (status.resolvedChoice) {
          console.log(`      Resolved Choice: ${status.resolvedChoice}`);
        }
      } catch (error) {
        console.error(`   ❌ Error getting prediction details:`, error);
      }
    }
  } catch (error) {
    console.error('   ❌ Error getting active predictions:', error);
  }

  console.log('\n✅ Contract integration test completed!\n');
}

// Run the test
testContractIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

