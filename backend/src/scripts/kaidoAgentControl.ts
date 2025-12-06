#!/usr/bin/env ts-node
/**
 * KAIDO Agent Control Script
 * 
 * Usage:
 *   npx ts-node src/scripts/kaidoAgentControl.ts enable      - Enable the agent
 *   npx ts-node src/scripts/kaidoAgentControl.ts disable     - Disable the agent
 *   npx ts-node src/scripts/kaidoAgentControl.ts pause       - Pause the agent
 *   npx ts-node src/scripts/kaidoAgentControl.ts resume      - Resume the agent
 *   npx ts-node src/scripts/kaidoAgentControl.ts status      - Get agent status
 *   npx ts-node src/scripts/kaidoAgentControl.ts config      - Show configuration
 *   npx ts-node src/scripts/kaidoAgentControl.ts create      - Trigger creation cycle
 *   npx ts-node src/scripts/kaidoAgentControl.ts resolve     - Trigger resolution cycle
 *   npx ts-node src/scripts/kaidoAgentControl.ts set <key> <value> - Update config
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AgentConfig from '../models/AgentConfig';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const printStatus = async () => {
  const config = await AgentConfig.getConfig();
  console.log('\n🤖 KAIDO Agent Status');
  console.log('━'.repeat(50));
  console.log(`  Enabled:            ${config.enabled ? '✅ Yes' : '❌ No'}`);
  console.log(`  Paused:             ${config.paused ? '⏸️  Yes' : '▶️  No'}`);
  console.log(`  Creation Enabled:   ${config.creationEnabled ? '✅ Yes' : '❌ No'}`);
  console.log(`  Resolution Enabled: ${config.resolutionEnabled ? '✅ Yes' : '❌ No'}`);
  console.log(`  Crypto Enabled:     ${config.cryptoEnabled ? '✅ Yes' : '❌ No'}`);
  console.log(`  Sports Enabled:     ${config.sportsEnabled ? '✅ Yes' : '❌ No'}`);
  console.log('');
  console.log('📊 Statistics');
  console.log('━'.repeat(50));
  console.log(`  Created Today:      ${config.predictionsCreatedToday}`);
  console.log(`  Total Created:      ${config.totalPredictionsCreated}`);
  console.log(`  Total Resolved:     ${config.totalPredictionsResolved}`);
  console.log(`  Max Per Day:        ${config.maxPredictionsPerDay}`);
  console.log('');
  console.log('⏰ Schedule');
  console.log('━'.repeat(50));
  console.log(`  Creation Cron:      ${config.creationCronSchedule}`);
  console.log(`  Resolution Cron:    ${config.resolutionCronSchedule}`);
  console.log('');
};

const printConfig = async () => {
  const config = await AgentConfig.getConfig();
  console.log('\n📋 KAIDO Agent Configuration');
  console.log('━'.repeat(50));
  console.log(JSON.stringify(config.toObject(), null, 2));
};

const setConfig = async (key: string, value: string) => {
  const parsedValue = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
  
  // Handle array values (comma-separated)
  let finalValue: any = parsedValue;
  if (key === 'cryptoAssets' || key === 'sportsCompetitions') {
    finalValue = value.split(',').map(s => s.trim());
  }
  
  await AgentConfig.findOneAndUpdate({}, { [key]: finalValue }, { upsert: true });
  console.log(`✅ Set ${key} = ${JSON.stringify(finalValue)}`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  if (!command) {
    console.log(`
🤖 KAIDO Agent Control Script

Usage:
  npx ts-node src/scripts/kaidoAgentControl.ts <command> [options]

Commands:
  enable      Enable the agent
  disable     Disable the agent
  pause       Pause the agent (keeps it enabled but doesn't run cycles)
  resume      Resume the agent
  status      Get current agent status
  config      Show full configuration
  set <key> <value>   Update a config value

Examples:
  npx ts-node src/scripts/kaidoAgentControl.ts enable
  npx ts-node src/scripts/kaidoAgentControl.ts set maxPredictionsPerDay 10
  npx ts-node src/scripts/kaidoAgentControl.ts set cryptoAssets BTC,ETH,BNB,SOL
`);
    process.exit(0);
  }
  
  await connectDB();
  
  switch (command) {
    case 'enable':
      await AgentConfig.findOneAndUpdate({}, { enabled: true }, { upsert: true });
      console.log('✅ KAIDO Agent ENABLED');
      await printStatus();
      break;
    case 'disable':
      await AgentConfig.findOneAndUpdate({}, { enabled: false }, { upsert: true });
      console.log('❌ KAIDO Agent DISABLED');
      break;
    case 'pause':
      await AgentConfig.findOneAndUpdate({}, { paused: true }, { upsert: true });
      console.log('⏸️  KAIDO Agent PAUSED');
      break;
    case 'resume':
      await AgentConfig.findOneAndUpdate({}, { paused: false }, { upsert: true });
      console.log('▶️  KAIDO Agent RESUMED');
      break;
    case 'status':
      await printStatus();
      break;
    case 'config':
      await printConfig();
      break;
    case 'set':
      if (args.length < 3) {
        console.log('Usage: set <key> <value>');
        process.exit(1);
      }
      await setConfig(args[1], args[2]);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      process.exit(1);
  }
  
  await mongoose.connection.close();
  process.exit(0);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});

