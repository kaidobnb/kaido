const { ethers } = require('hardhat');
require('dotenv').config();

// Contract address from deployment
const CONTRACT_ADDRESS = '0xc89E3b091E5E7c833885fC7491E6fD9D333Cf869';

async function main() {
  console.log('🚀 Starting Kaido LP Token Presale...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('👤 Starting presale with account:', deployer.address);

  // Get contract instance
  const KaidoLP = await ethers.getContractFactory('KaidoLP');
  const kaidoLP = KaidoLP.attach(CONTRACT_ADDRESS);

  // Check if caller is owner
  const owner = await kaidoLP.owner();
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error('❌ Only the contract owner can start the presale');
  }

  // Check current presale status
  const presaleInfo = await kaidoLP.getPresaleInfo();
  if (presaleInfo.active) {
    console.log('⚠️  Presale is already active!');
    return;
  }

  // Set presale parameters
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 60; // Start in 1 minute
  const endTime = now + (30 * 24 * 60 * 60); // End in 30 days
  const price = ethers.utils.parseEther('0.0004'); // 0.0004 BNB per token

  console.log('⏰ Start Time:', new Date(startTime * 1000).toLocaleString());
  console.log('⏰ End Time:', new Date(endTime * 1000).toLocaleString());
  console.log('💰 Price:', ethers.utils.formatEther(price), 'BNB per token');

  // Start the presale
  console.log('📦 Starting presale transaction...');
  const tx = await kaidoLP.startPresale(startTime, endTime, price);
  console.log('⏳ Transaction hash:', tx.hash);
  
  console.log('⏳ Waiting for confirmation...');
  await tx.wait();

  console.log('✅ Presale started successfully!');
  console.log('🎯 Presale is now active and ready to accept contributions');
  console.log('🔗 Contract: https://bscscan.com/address/' + CONTRACT_ADDRESS);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error starting presale:', error.message);
      process.exit(1);
    });
}

module.exports = main;
