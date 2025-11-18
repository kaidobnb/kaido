const { privateKeyToAccount } = require('viem/accounts');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate BNB wallets for KAIDO platform
 * This script creates two new wallets:
 * 1. Loss Edge Pool - For daily BNB airdrops to users who lost predictions
 * 2. KAIDO Treasury - For platform operations and AI development
 */

const generateWallet = (name) => {
  console.log(`\n🔐 Generating ${name} wallet...`);

  // Generate a random 32-byte private key
  const randomBytes = crypto.randomBytes(32);
  const privateKey = '0x' + randomBytes.toString('hex');

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  console.log(`✅ ${name} wallet generated successfully!`);
  console.log(`   Address: ${account.address}`);
  console.log(`   Private Key: ${privateKey}`);

  return {
    address: account.address,
    privateKey: privateKey
  };
};

const main = () => {
  console.log('🚀 KAIDO Wallet Generation Script');
  console.log('==================================\n');

  // Generate Loss Edge Pool wallet
  const lossEdgePool = generateWallet('Loss Edge Pool');

  // Generate KAIDO Treasury wallet
  const kaidoTreasury = generateWallet('KAIDO Treasury');

  // Create wasp.json configuration
  const waspConfig = {
    lossEdgePool: {
      address: lossEdgePool.address,
      privateKey: lossEdgePool.privateKey
    },
    kaidoTreasury: {
      address: kaidoTreasury.address,
      privateKey: kaidoTreasury.privateKey
    },
    createdAt: new Date().toISOString(),
    description: 'KAIDO platform wallets for fee distribution. Loss Edge Pool: Daily BNB airdrops to users who lost predictions. KAIDO Treasury: Platform operations and AI development.'
  };

  // Save to wasp.json in backend directory
  const waspPath = path.join(__dirname, '..', 'wasp.json');
  fs.writeFileSync(waspPath, JSON.stringify(waspConfig, null, 2));

  console.log('\n✅ Wallets saved to wasp.json');
  console.log(`   File location: ${waspPath}`);

  console.log('\n📋 Summary:');
  console.log('==================================');
  console.log(`Loss Edge Pool Address: ${lossEdgePool.address}`);
  console.log(`KAIDO Treasury Address: ${kaidoTreasury.address}`);
  console.log('\n⚠️  IMPORTANT: Keep wasp.json secure and never commit it to version control!');
  console.log('   Add wasp.json to .gitignore if not already present.');

  // Check if .gitignore exists and add wasp.json if needed
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('wasp.json')) {
      fs.appendFileSync(gitignorePath, '\n# KAIDO wallet credentials\nwasp.json\n');
      console.log('   ✅ Added wasp.json to .gitignore');
    }
  }
};

// Run the script
main();

