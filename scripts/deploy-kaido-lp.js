const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting Kaido LP Token deployment...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log('💰 Account balance:', ethers.utils.formatEther(balance), 'BNB');

  if (balance.lt(ethers.utils.parseEther('0.01'))) {
    throw new Error('❌ Insufficient BNB balance for deployment. Need at least 0.01 BNB');
  }

  // Deploy the KaidoLP contract
  console.log('📦 Deploying KaidoLP contract...');
  const KaidoLP = await ethers.getContractFactory('KaidoLP');
  
  // Deploy with gas estimation
  const estimatedGas = await KaidoLP.signer.estimateGas(KaidoLP.getDeployTransaction());
  console.log('⛽ Estimated gas for deployment:', estimatedGas.toString());

  const kaidoLP = await KaidoLP.deploy({
    gasLimit: estimatedGas.mul(120).div(100), // Add 20% buffer
  });

  console.log('⏳ Waiting for deployment transaction...');
  await kaidoLP.deployed();

  console.log('✅ KaidoLP deployed successfully!');
  console.log('📍 Contract address:', kaidoLP.address);
  console.log('🔗 Transaction hash:', kaidoLP.deployTransaction.hash);

  // Verify contract details
  console.log('\n📊 Contract Details:');
  const name = await kaidoLP.name();
  const symbol = await kaidoLP.symbol();
  const decimals = await kaidoLP.decimals();
  const totalSupply = await kaidoLP.totalSupply();
  const owner = await kaidoLP.owner();

  console.log('📛 Name:', name);
  console.log('🏷️  Symbol:', symbol);
  console.log('🔢 Decimals:', decimals);
  console.log('💎 Total Supply:', ethers.utils.formatEther(totalSupply), symbol);
  console.log('👤 Owner:', owner);

  // Get presale info
  const presaleInfo = await kaidoLP.getPresaleInfo();
  console.log('\n🎯 Presale Information:');
  console.log('🔴 Active:', presaleInfo.active);
  console.log('💰 Price:', ethers.utils.formatEther(presaleInfo.price), 'BNB per token');
  console.log('📉 Min Contribution:', ethers.utils.formatEther(presaleInfo.minContrib), 'BNB');
  console.log('📈 Max Contribution:', ethers.utils.formatEther(presaleInfo.maxContrib), 'BNB');
  console.log('🎫 Total Presale Tokens:', ethers.utils.formatEther(presaleInfo.totalTokens), symbol);
  console.log('🎪 Sold Tokens:', ethers.utils.formatEther(presaleInfo.soldTokens), symbol);

  // Save deployment info
  const deploymentInfo = {
    network: 'BSC Mainnet',
    chainId: 56,
    contractName: 'KaidoLP',
    contractAddress: kaidoLP.address,
    deployerAddress: deployer.address,
    transactionHash: kaidoLP.deployTransaction.hash,
    blockNumber: kaidoLP.deployTransaction.blockNumber,
    gasUsed: kaidoLP.deployTransaction.gasLimit?.toString(),
    timestamp: new Date().toISOString(),
    contractDetails: {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString(),
      owner
    },
    presaleInfo: {
      active: presaleInfo.active,
      price: presaleInfo.price.toString(),
      minContribution: presaleInfo.minContrib.toString(),
      maxContribution: presaleInfo.maxContrib.toString(),
      totalPresaleTokens: presaleInfo.totalTokens.toString(),
      soldTokens: presaleInfo.soldTokens.toString()
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `kaido-lp-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log('💾 Deployment info saved to:', deploymentFile);

  // Save latest deployment info
  const latestFile = path.join(deploymentsDir, 'kaido-lp-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log('💾 Latest deployment info saved to:', latestFile);

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Verify the contract on BSCScan');
  console.log('2. Configure presale parameters if needed');
  console.log('3. Start the presale when ready');
  console.log('4. Update frontend with the new contract address');

  console.log('\n🔗 BSCScan URL:');
  console.log(`https://bscscan.com/address/${kaidoLP.address}`);

  return {
    contract: kaidoLP,
    address: kaidoLP.address,
    deploymentInfo
  };
}

// Handle deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = main;
