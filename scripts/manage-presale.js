const { ethers } = require('hardhat');
require('dotenv').config();

// Contract address from deployment
const CONTRACT_ADDRESS = '0xc89E3b091E5E7c833885fC7491E6fD9D333Cf869';

async function main() {
  console.log('🎯 Kaido LP Token Presale Management');
  console.log('=====================================');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('👤 Managing with account:', deployer.address);

  // Get contract instance
  const KaidoLP = await ethers.getContractFactory('KaidoLP');
  const kaidoLP = KaidoLP.attach(CONTRACT_ADDRESS);

  // Check current status
  console.log('\n📊 Current Contract Status:');
  const name = await kaidoLP.name();
  const symbol = await kaidoLP.symbol();
  const totalSupply = await kaidoLP.totalSupply();
  const owner = await kaidoLP.owner();
  const balance = await kaidoLP.balanceOf(owner);

  console.log('📛 Name:', name);
  console.log('🏷️  Symbol:', symbol);
  console.log('💎 Total Supply:', ethers.utils.formatEther(totalSupply), symbol);
  console.log('👤 Owner:', owner);
  console.log('💰 Owner Balance:', ethers.utils.formatEther(balance), symbol);

  // Get presale info
  const presaleInfo = await kaidoLP.getPresaleInfo();
  console.log('\n🎯 Presale Information:');
  console.log('🔴 Active:', presaleInfo.active);
  console.log('💰 Price:', ethers.utils.formatEther(presaleInfo.price), 'BNB per token');
  console.log('📉 Min Contribution:', ethers.utils.formatEther(presaleInfo.minContrib), 'BNB');
  console.log('📈 Max Contribution:', ethers.utils.formatEther(presaleInfo.maxContrib), 'BNB');
  console.log('🎫 Total Presale Tokens:', ethers.utils.formatEther(presaleInfo.totalTokens), symbol);
  console.log('🎪 Sold Tokens:', ethers.utils.formatEther(presaleInfo.soldTokens), symbol);

  if (presaleInfo.active) {
    console.log('⏰ Start Time:', new Date(presaleInfo.startTime * 1000).toLocaleString());
    console.log('⏰ End Time:', new Date(presaleInfo.endTime * 1000).toLocaleString());
  }

  console.log('\n🔗 Contract Address:', CONTRACT_ADDRESS);
  console.log('🔗 BSCScan URL: https://bscscan.com/address/' + CONTRACT_ADDRESS);

  console.log('\n📋 Available Management Commands:');
  console.log('1. Start Presale: node scripts/start-presale.js');
  console.log('2. End Presale: node scripts/end-presale.js');
  console.log('3. Update Presale Params: node scripts/update-presale.js');
  console.log('4. Withdraw Funds: node scripts/withdraw-funds.js');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = main;
