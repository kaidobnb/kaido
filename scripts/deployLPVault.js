const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying LP Vault System to BSC Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Load existing deployment
  const deploymentPath = path.join(__dirname, "../deployments/prediction-system-latest.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const PREDICTION_FACTORY = deployment.contracts.PredictionFactory.address;
  const FEE_DISTRIBUTOR = deployment.contracts.FeeDistributor.address;
  const ADMIN_ADDRESS = deployer.address; // Admin is deployer for now

  console.log("📋 Existing Contracts:");
  console.log("   PredictionFactory:", PREDICTION_FACTORY);
  console.log("   FeeDistributor:   ", FEE_DISTRIBUTOR);
  console.log("   Admin:            ", ADMIN_ADDRESS);
  console.log("");

  // 1. Deploy LPVault
  console.log("1️⃣  Deploying LPVault...");
  const LPVault = await ethers.getContractFactory("LPVault");
  const lpVault = await LPVault.deploy(ADMIN_ADDRESS);
  await lpVault.deployed();
  const lpVaultAddress = lpVault.address;
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

  try {
    console.log("   - Setting LPVault address...");
    const tx3 = await predictionFactory.setLPVault(lpVaultAddress);
    await tx3.wait();
    console.log("   ✅ LPVault address set in PredictionFactory");
  } catch (error) {
    console.log("   ⚠️  Could not set LPVault in PredictionFactory (may need owner access)");
    console.log("   ℹ️  Manual step required: Call setLPVault(" + lpVaultAddress + ") on PredictionFactory");
  }

  // 4. Update FeeDistributor (requires owner)
  console.log("\n4️⃣  Updating FeeDistributor...");
  const feeDistributor = await ethers.getContractAt("FeeDistributor", FEE_DISTRIBUTOR);

  try {
    console.log("   - Setting LPVault address...");
    const tx4 = await feeDistributor.setLPVault(lpVaultAddress);
    await tx4.wait();
    console.log("   ✅ LPVault address set in FeeDistributor");
  } catch (error) {
    console.log("   ⚠️  Could not set LPVault in FeeDistributor (may need owner access)");
    console.log("   ℹ️  Manual step required: Call setLPVault(" + lpVaultAddress + ") on FeeDistributor");
  }

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
  const lpDeployment = {
    network: "bscTestnet",
    chainId: 97,
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
  console.log(JSON.stringify(lpDeployment, null, 2));

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const deploymentFile = path.join(deploymentsDir, `lp-vault-${timestamp}.json`);
  const latestFile = path.join(deploymentsDir, "lp-vault-latest.json");

  fs.writeFileSync(deploymentFile, JSON.stringify(lpDeployment, null, 2));
  fs.writeFileSync(latestFile, JSON.stringify(lpDeployment, null, 2));

  console.log("\n💾 Deployment saved to:");
  console.log("   ", deploymentFile);
  console.log("   ", latestFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

