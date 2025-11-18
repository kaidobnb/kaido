const { ethers } = require('hardhat');
require('dotenv').config();

// Deployed contract address
const CONTRACT_ADDRESS = '0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5';

async function main() {
  console.log('📦 Kaido LP Token Distribution Tool');
  console.log('===================================');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('👤 Distributing with account:', deployer.address);

  // Get contract instance
  const KaidoLPToken = await ethers.getContractFactory('KaidoLPToken');
  const kaidoLPToken = KaidoLPToken.attach(CONTRACT_ADDRESS);

  // Check if caller is owner
  const owner = await kaidoLPToken.owner();
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error('❌ Only the contract owner can distribute tokens');
  }

  // Example distribution data
  // Replace with actual presale participant addresses and amounts
  const distributions = [
    {
      address: '0x1234567890123456789012345678901234567890',
      amount: '1000', // 1000 KAIDO tokens
      note: 'Presale participant 1'
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      amount: '2500', // 2500 KAIDO tokens
      note: 'Presale participant 2'
    },
    // Add more participants here...
  ];

  console.log(`\n📋 Preparing to distribute to ${distributions.length} participants:`);
  
  let totalTokens = ethers.BigNumber.from(0);
  const recipients = [];
  const amounts = [];
  
  for (let i = 0; i < distributions.length; i++) {
    const dist = distributions[i];
    const tokenAmount = ethers.utils.parseEther(dist.amount);
    
    recipients.push(dist.address);
    amounts.push(tokenAmount);
    totalTokens = totalTokens.add(tokenAmount);
    
    console.log(`${i + 1}. ${dist.address} - ${dist.amount} KAIDO (${dist.note})`);
  }
  
  console.log(`\n💎 Total tokens to distribute: ${ethers.utils.formatEther(totalTokens)} KAIDO`);
  
  // Check owner balance
  const ownerBalance = await kaidoLPToken.balanceOf(owner);
  console.log(`💰 Owner balance: ${ethers.utils.formatEther(ownerBalance)} KAIDO`);
  
  if (ownerBalance.lt(totalTokens)) {
    throw new Error('❌ Insufficient token balance for distribution');
  }
  
  // Perform batch transfer
  console.log('\n📦 Executing batch transfer...');
  const tx = await kaidoLPToken.batchTransfer(recipients, amounts);
  console.log('⏳ Transaction hash:', tx.hash);
  
  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait();
  
  console.log('✅ Distribution completed successfully!');
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`🔗 Transaction: https://bscscan.com/tx/${tx.hash}`);
  
  // Verify distributions
  console.log('\n🔍 Verifying distributions:');
  for (let i = 0; i < recipients.length; i++) {
    const balance = await kaidoLPToken.balanceOf(recipients[i]);
    console.log(`✅ ${recipients[i]}: ${ethers.utils.formatEther(balance)} KAIDO`);
  }
  
  // Show updated owner balance
  const newOwnerBalance = await kaidoLPToken.balanceOf(owner);
  console.log(`\n💰 Updated owner balance: ${ethers.utils.formatEther(newOwnerBalance)} KAIDO`);
}

// Function to distribute to a single address
async function distributeSingle(recipientAddress, tokenAmount, note = '') {
  console.log('📦 Single Token Distribution');
  console.log('============================');

  const [deployer] = await ethers.getSigners();
  const KaidoLPToken = await ethers.getContractFactory('KaidoLPToken');
  const kaidoLPToken = KaidoLPToken.attach(CONTRACT_ADDRESS);

  const owner = await kaidoLPToken.owner();
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error('❌ Only the contract owner can distribute tokens');
  }

  const amount = ethers.utils.parseEther(tokenAmount);
  
  console.log(`👤 Recipient: ${recipientAddress}`);
  console.log(`💎 Amount: ${tokenAmount} KAIDO`);
  console.log(`📝 Note: ${note}`);
  
  const tx = await kaidoLPToken.transfer(recipientAddress, amount);
  console.log('⏳ Transaction hash:', tx.hash);
  
  await tx.wait();
  console.log('✅ Distribution completed!');
  
  const balance = await kaidoLPToken.balanceOf(recipientAddress);
  console.log(`💰 Recipient balance: ${ethers.utils.formatEther(balance)} KAIDO`);
}

if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 2 || args.length === 3) {
    // Single distribution: node distribute-tokens.js <address> <amount> [note]
    const [address, amount, note] = args;
    distributeSingle(address, amount, note || '')
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Distribution failed:', error.message);
        process.exit(1);
      });
  } else {
    // Batch distribution
    main()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Distribution failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { main, distributeSingle };
