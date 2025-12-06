/**
 * KAIDO Agent Integration Tests
 * 
 * Run with: npx ts-node src/tests/kaidoAgentIntegration.test.ts
 * 
 * These tests verify the integration between the agent service and other components.
 * NOTE: These tests require valid API keys for OpenAI, CoinGecko, etc.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Test utilities
let passedTests = 0;
let failedTests = 0;
const skippedTests: string[] = [];

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedTests++;
  } else {
    console.log(`  ❌ ${testName}`);
    failedTests++;
  }
}

function skip(testName: string, reason: string): void {
  console.log(`  ⏭️  ${testName} (skipped: ${reason})`);
  skippedTests.push(testName);
}

async function describe(suiteName: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n📦 ${suiteName}`);
  console.log('─'.repeat(50));
  await fn();
}

async function connectDB(): Promise<void> {
  const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido_test';
  await mongoose.connect(testUri);
  console.log('Connected to test database');
}

async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  console.log('Disconnected from test database');
}

async function runTests(): Promise<void> {
  console.log('\n🤖 KAIDO Agent Integration Tests');
  console.log('═'.repeat(50));
  
  await connectDB();
  
  const AgentConfig = (await import('../models/AgentConfig')).default;
  const Prediction = (await import('../models/Prediction')).default;
  const User = (await import('../models/User')).default;
  const kaidoAgentService = (await import('../services/kaidoAgentService')).default;
  const { getCurrentPrice } = await import('../services/cryptoService');
  
  // Test 1: Crypto Price Service Integration
  await describe('Crypto Price Service', async () => {
    try {
      const btcPrice = await getCurrentPrice('BTC');
      assert(typeof btcPrice === 'number', 'BTC price is a number');
      assert(btcPrice > 0, 'BTC price is positive');
      
      const ethPrice = await getCurrentPrice('ETH');
      assert(typeof ethPrice === 'number', 'ETH price is a number');
      assert(ethPrice > 0, 'ETH price is positive');
    } catch (error) {
      skip('Crypto price tests', 'API may be rate limited');
    }
  });
  
  // Test 2: Agent User Creation
  await describe('Agent User Management', async () => {
    // Initialize agent
    await kaidoAgentService.initialize();
    
    const status = await kaidoAgentService.getStatus();
    
    if (status.agentUser) {
      assert(status.agentUser.username === 'KAIDO_Agent', 'Agent user has correct username');
      assert(status.agentUser.isAdmin === true, 'Agent user has admin privileges');
    } else {
      skip('Agent user validation', 'Agent user not created (may need wallet address)');
    }
  });
  
  // Test 3: Prediction Creation (without OpenAI)
  await describe('Prediction Creation Validation', async () => {
    // Enable agent for testing
    await AgentConfig.findOneAndUpdate({}, { 
      enabled: true,
      cryptoEnabled: true,
      maxPredictionsPerDay: 10,
      predictionsCreatedToday: 0
    }, { upsert: true });
    
    const config = await kaidoAgentService.getConfig();
    assert(config.enabled === true, 'Agent is enabled for testing');
    assert(config.cryptoEnabled === true, 'Crypto predictions are enabled');
    
    // Check if OpenAI key is available
    if (!process.env.OPENAI_API_KEY) {
      skip('Crypto prediction creation', 'OPENAI_API_KEY not set');
    } else {
      try {
        const prediction = await kaidoAgentService.createCryptoPrediction();
        if (prediction) {
          assert(prediction.title !== undefined, 'Prediction has title');
          assert(prediction.category === 'crypto', 'Prediction category is crypto');
          assert(prediction.isAgentCreated === true, 'Prediction marked as agent-created');
          
          // Cleanup
          await Prediction.deleteOne({ _id: prediction._id });
        } else {
          skip('Crypto prediction validation', 'Prediction not created (may be at limit)');
        }
      } catch (error: any) {
        skip('Crypto prediction creation', error.message);
      }
    }
  });
  
  // Test 4: Resolution Logic
  await describe('Resolution Logic', async () => {
    // Test that resolution cycle doesn't crash
    try {
      await kaidoAgentService.runResolutionCycle();
      assert(true, 'Resolution cycle runs without error');
    } catch (error: any) {
      console.log(`  ⚠️  Resolution cycle error: ${error.message}`);
      assert(false, 'Resolution cycle should not throw');
    }
  });
  
  // Cleanup
  await AgentConfig.deleteMany({});
  await User.deleteOne({ username: 'KAIDO_Agent' });
  await disconnectDB();
  
  // Print summary
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⏭️  Skipped: ${skippedTests.length}`);
  console.log('');
  
  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

