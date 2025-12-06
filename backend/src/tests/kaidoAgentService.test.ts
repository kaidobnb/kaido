/**
 * KAIDO Agent Service Tests
 * 
 * Run with: npx ts-node src/tests/kaidoAgentService.test.ts
 * 
 * These tests verify the core functionality of the KAIDO AI Agent service.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Test utilities
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedTests++;
  } else {
    console.log(`  ❌ ${testName}`);
    failedTests++;
  }
}

async function describe(suiteName: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n📦 ${suiteName}`);
  console.log('─'.repeat(50));
  await fn();
}

// Connect to test database
async function connectDB(): Promise<void> {
  const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido_test';
  await mongoose.connect(testUri);
  console.log('Connected to test database');
}

async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  console.log('Disconnected from test database');
}

// Import services after environment is loaded
async function runTests(): Promise<void> {
  console.log('\n🤖 KAIDO Agent Service Tests');
  console.log('═'.repeat(50));
  
  await connectDB();
  
  // Import after DB connection
  const AgentConfig = (await import('../models/AgentConfig')).default;
  const kaidoAgentService = (await import('../services/kaidoAgentService')).default;
  
  // Test 1: AgentConfig Model
  await describe('AgentConfig Model', async () => {
    // Clean up existing config
    await AgentConfig.deleteMany({});
    
    // Test getConfig creates default config
    const config = await AgentConfig.getConfig();
    assert(config !== null, 'getConfig returns a config object');
    assert(typeof config.enabled === 'boolean', 'Config has enabled property');
    assert(typeof config.maxPredictionsPerDay === 'number', 'Config has maxPredictionsPerDay');
    assert(Array.isArray(config.cryptoAssets), 'Config has cryptoAssets array');
    
    // Test default values
    assert(config.enabled === false, 'Agent is disabled by default');
    assert(config.paused === false, 'Agent is not paused by default');
    assert(config.cryptoEnabled === true, 'Crypto is enabled by default');
    assert(config.sportsEnabled === true, 'Sports is enabled by default');
    
    // Test updating config
    await AgentConfig.findOneAndUpdate({}, { maxPredictionsPerDay: 20 });
    const updatedConfig = await AgentConfig.getConfig();
    assert(updatedConfig.maxPredictionsPerDay === 20, 'Config can be updated');
  });
  
  // Test 2: Agent Service Initialization
  await describe('Agent Service Initialization', async () => {
    await kaidoAgentService.initialize();
    
    const config = await kaidoAgentService.getConfig();
    assert(config !== null, 'getConfig returns config after initialization');
    
    const status = await kaidoAgentService.getStatus();
    assert(status !== null, 'getStatus returns status object');
    assert(typeof status.config === 'object', 'Status includes config');
    assert(typeof status.agentUser === 'object' || status.agentUser === null, 'Status includes agentUser');
  });
  
  // Test 3: Check Limits
  await describe('Daily Limit Checking', async () => {
    // Reset the counter
    await AgentConfig.findOneAndUpdate({}, { 
      predictionsCreatedToday: 0,
      maxPredictionsPerDay: 5,
      lastCreationReset: new Date()
    });
    
    // Service should allow creation when under limit
    const config = await kaidoAgentService.getConfig();
    assert(config.predictionsCreatedToday < config.maxPredictionsPerDay, 'Under daily limit initially');
    
    // Simulate reaching limit
    await AgentConfig.findOneAndUpdate({}, { predictionsCreatedToday: 5 });
    const configAtLimit = await kaidoAgentService.getConfig();
    assert(configAtLimit.predictionsCreatedToday >= configAtLimit.maxPredictionsPerDay, 'At limit after update');
  });
  
  // Test 4: Config Validation
  await describe('Config Validation', async () => {
    const config = await kaidoAgentService.getConfig();
    
    // Check cryptoAssets is valid
    assert(config.cryptoAssets.length > 0, 'Has at least one crypto asset');
    assert(config.cryptoAssets.includes('BTC'), 'Includes BTC by default');
    
    // Check cron schedules
    assert(typeof config.creationCronSchedule === 'string', 'Has creation cron schedule');
    assert(typeof config.resolutionCronSchedule === 'string', 'Has resolution cron schedule');
    
    // Check AI settings
    assert(typeof config.aiModel === 'string', 'Has AI model setting');
    assert(typeof config.aiTemperature === 'number', 'Has AI temperature setting');
    assert(config.aiTemperature >= 0 && config.aiTemperature <= 2, 'AI temperature in valid range');
  });
  
  // Cleanup
  await AgentConfig.deleteMany({});
  await disconnectDB();
  
  // Print summary
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed\n`);
  
  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

