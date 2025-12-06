import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying LP Vault System...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // Get existing contract addresses (from previous deployments)
  const PREDICTION_FACTORY = "0xa6a8418fb7553af50B5974B750Bc7b99474cBb99"; // BSC Testnet
  const FEE_DISTRIBUTOR = "0x0CDe93bB9C9c1dc28f6b9a2d8898Ff64e567dD25"; // BSC Testnet
  const ADMIN_ADDRESS = deployer.address; // Or use specific admin address

  // 1. Deploy LPVault
  console.log("1️⃣  Deploying LPVault...");
  const LPVault = await ethers.getContractFactory("LPVault");
  const lpVault = await LPVault.deploy(ADMIN_ADDRESS);
  await lpVault.waitForDeployment();
  const lpVaultAddress = await lpVault.getAddress();
  console.log("✅ LPVault deployed to:", lpVaultAddress);

  // 2. Configure LPVault
  console.log("\n2️⃣  Configuring LPVault...");

  console.log("   - Setting PredictionFactory address...");
  const tx1 = await lpVault.setPredictionFactory(PREDICTION_FACTORY);
  await tx1.wait();
  console.log("   ✅ PredictionFactory set");

  console.log("   - Setting FeeDistributor address...");
  const tx2 = await lpVault.setFeeDistributor(FEE_DISTRIBUTOR);
  await tx2.wait();
  console.log("   ✅ FeeDistributor set");

  // 3. Update PredictionFactory (requires owner)
  console.log("\n3️⃣  Updating PredictionFactory...");
  const predictionFactory = await ethers.getContractAt("PredictionFactory", PREDICTION_FACTORY);

  console.log("   - Setting LPVault address...");
  const tx3 = await predictionFactory.setLPVault(lpVaultAddress);
  await tx3.wait();
  console.log("   ✅ LPVault address set in PredictionFactory");

  // 4. Update FeeDistributor (requires owner)
  console.log("\n4️⃣  Updating FeeDistributor...");
  const feeDistributor = await ethers.getContractAt("FeeDistributor", FEE_DISTRIBUTOR);

  console.log("   - Setting LPVault address...");
  const tx4 = await feeDistributor.setLPVault(lpVaultAddress);
  await tx4.wait();
  console.log("   ✅ LPVault address set in FeeDistributor");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 LP Vault System Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Deployed Contracts:");
  console.log("   LPVault:           ", lpVaultAddress);
  console.log("\n🔗 Existing Contracts:");
  console.log("   PredictionFactory: ", PREDICTION_FACTORY);
  console.log("   FeeDistributor:    ", FEE_DISTRIBUTOR);
  console.log("\n⚙️  Configuration:");
  console.log("   Admin:             ", ADMIN_ADDRESS);
  console.log("   Deployer:          ", deployer.address);
  console.log("\n💡 Vault Structure:");
  console.log("   Boost Vault:       70% of stakes");
  console.log("   Creator Vault:     30% of stakes");
  console.log("\n💰 Yield Engines:");
  console.log("   1. KAIDO Boost:    30% of treasury fees");
  console.log("   2. Creator Backing: 30% of (creator + affiliate) fees");
  console.log("   3. Engagement:     30% of campaign fees (configurable)");
  console.log("\n💡 Next Steps:");
  console.log("   1. Verify contracts on BSCScan");
  console.log("   2. Test staking functionality");
  console.log("   3. Boost a prediction with adminBoostPrediction()");
  console.log("   4. Monitor yield accumulation");
  console.log("   5. Test reward claiming");
  console.log("\n" + "=".repeat(60));

  // Save deployment info
  const deployment = {
    network: "bsc-testnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      LPVault: lpVaultAddress,
      PredictionFactory: PREDICTION_FACTORY,
      FeeDistributor: FEE_DISTRIBUTOR
    },
    config: {
      admin: ADMIN_ADDRESS,
      boostVaultPercentage: 70,
      creatorVaultPercentage: 30,
      maxDeploymentPerPrediction: 20, // 20%
      minStakeAmount: "0.01", // BNB
      lpYieldPercentage: 30 // 30% of applicable fees
    }
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deployment, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

