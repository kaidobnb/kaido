const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting Simple Kaido LP Token deployment...');
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  const balanceInBNB = ethers.utils.formatEther(balance);
  console.log('💰 Account balance:', balanceInBNB, 'BNB');
  
  if (parseFloat(balanceInBNB) < 0.01) {
    throw new Error('❌ Insufficient BNB balance for deployment. Need at least 0.01 BNB');
  }
  
  // Get the contract factory
  const KaidoLPToken = await ethers.getContractFactory('KaidoLPToken');
  
  // Estimate gas
  const estimatedGas = await ethers.provider.estimateGas(
    KaidoLPToken.getDeployTransaction()
  );
  console.log('⛽ Estimated gas for deployment:', estimatedGas.toString());
  
  // Deploy the contract
  console.log('📦 Deploying KaidoLPToken contract...');
  const kaidoLPToken = await KaidoLPToken.deploy({
    gasLimit: estimatedGas.mul(120).div(100), // Add 20% buffer
  });
  
  console.log('⏳ Waiting for deployment transaction...');
  await kaidoLPToken.deployed();
  
  console.log('✅ KaidoLPToken deployed successfully!');
  console.log('📍 Contract address:', kaidoLPToken.address);
  console.log('🔗 Transaction hash:', kaidoLPToken.deployTransaction.hash);
  
  // Get contract details
  const name = await kaidoLPToken.name();
  const symbol = await kaidoLPToken.symbol();
  const decimals = await kaidoLPToken.decimals();
  const totalSupply = await kaidoLPToken.totalSupply();
  const owner = await kaidoLPToken.owner();
  const ownerBalance = await kaidoLPToken.balanceOf(owner);
  
  console.log('\n📊 Contract Details:');
  console.log('📛 Name:', name);
  console.log('🏷️  Symbol:', symbol);
  console.log('🔢 Decimals:', decimals);
  console.log('💎 Total Supply:', ethers.utils.formatEther(totalSupply), symbol);
  console.log('👤 Owner:', owner);
  console.log('💰 Owner Balance:', ethers.utils.formatEther(ownerBalance), symbol);
  
  // Save deployment info
  const deploymentInfo = {
    network: 'BSC Mainnet',
    chainId: 56,
    contractName: 'KaidoLPToken',
    contractAddress: kaidoLPToken.address,
    deployerAddress: deployer.address,
    transactionHash: kaidoLPToken.deployTransaction.hash,
    gasUsed: (await kaidoLPToken.deployTransaction.wait()).gasUsed.toString(),
    timestamp: new Date().toISOString(),
    contractDetails: {
      name: name,
      symbol: symbol,
      decimals: decimals,
      totalSupply: totalSupply.toString(),
      owner: owner
    }
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info with timestamp
  const timestamp = Date.now();
  const deploymentFile = path.join(deploymentsDir, `kaido-lp-token-${timestamp}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  // Save latest deployment info
  const latestFile = path.join(deploymentsDir, 'kaido-lp-token-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('💾 Deployment info saved to:', deploymentFile);
  console.log('💾 Latest deployment info saved to:', latestFile);
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Verify the contract on BSCScan (optional)');
  console.log('2. Use batchTransfer() to distribute tokens to presale participants');
  console.log('3. Update frontend with the new contract address');
  console.log('4. Test token transfers');
  
  console.log('\n🔗 BSCScan URL:');
  console.log(`https://bscscan.com/address/${kaidoLPToken.address}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = main;
