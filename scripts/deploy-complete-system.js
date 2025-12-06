const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Complete KAIDO Prediction System with LP Vault to BSC Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Get treasury address from environment or use deployer
  const treasuryAddress = process.env.TREASURY_ADDRESS || "0x59548ab18064F229522aDab6A540e8b4b35543c8";
  const oracleAddress = deployer.address;
  const adminAddress = deployer.address;

  console.log("📋 Configuration:");
  console.log("   Treasury:  ", treasuryAddress);
  console.log("   Oracle:    ", oracleAddress);
  console.log("   Admin:     ", adminAddress);
  console.log("");

  // Step 1: Deploy LossEdgeVault
  console.log("1️⃣  Deploying LossEdgeVault...");
  const LossEdgeVault = await ethers.getContractFactory("LossEdgeVault");
  const lossEdgeVault = await LossEdgeVault.deploy();
  await lossEdgeVault.deployed();
  console.log("✅ LossEdgeVault deployed to:", lossEdgeVault.address);

  // Step 2: Deploy FeeDistributor
  console.log("\n2️⃣  Deploying FeeDistributor...");
  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await FeeDistributor.deploy(
    lossEdgeVault.address,
    treasuryAddress
  );
  await feeDistributor.deployed();
  console.log("✅ FeeDistributor deployed to:", feeDistributor.address);

  // Step 3: Deploy PredictionFactory
  console.log("\n3️⃣  Deploying PredictionFactory...");
  const PredictionFactory = await ethers.getContractFactory("PredictionFactory");
  const predictionFactory = await PredictionFactory.deploy(
    oracleAddress,
    feeDistributor.address
  );
  await predictionFactory.deployed();
  console.log("✅ PredictionFactory deployed to:", predictionFactory.address);

  // Step 4: Deploy LPVault
  console.log("\n4️⃣  Deploying LPVault...");
  const LPVault = await ethers.getContractFactory("LPVault");
  const lpVault = await LPVault.deploy(adminAddress);
  await lpVault.deployed();
  console.log("✅ LPVault deployed to:", lpVault.address);

  // Step 5: Configure all contracts
  console.log("\n5️⃣  Configuring contracts...");

  console.log("   - Setting PredictionFactory in FeeDistributor...");
  const tx1 = await feeDistributor.setPredictionFactory(predictionFactory.address);
  await tx1.wait();
  console.log("   ✅ Done");

  console.log("   - Setting PredictionFactory in LossEdgeVault...");
  const tx2 = await lossEdgeVault.setPredictionFactory(predictionFactory.address);
  await tx2.wait();
  console.log("   ✅ Done");

  console.log("   - Setting LPVault in FeeDistributor...");
  const tx3 = await feeDistributor.setLPVault(lpVault.address);
  await tx3.wait();
  console.log("   ✅ Done");

  console.log("   - Setting LPVault in PredictionFactory...");
  const tx4 = await predictionFactory.setLPVault(lpVault.address);
  await tx4.wait();
  console.log("   ✅ Done");

  console.log("   - Setting PredictionFactory in LPVault...");
  const tx5 = await lpVault.setPredictionFactory(predictionFactory.address);
  await tx5.wait();
  console.log("   ✅ Done");

  console.log("   - Setting FeeDistributor in LPVault...");
  const tx6 = await lpVault.setFeeDistributor(feeDistributor.address);
  await tx6.wait();
  console.log("   ✅ Done");

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 Complete System Deployment Successful!");
  console.log("=".repeat(70));
  console.log("\n📋 Deployed Contracts:");
  console.log("   PredictionFactory:  ", predictionFactory.address);
  console.log("   FeeDistributor:     ", feeDistributor.address);
  console.log("   LossEdgeVault:      ", lossEdgeVault.address);
  console.log("   LPVault:            ", lpVault.address);
  console.log("\n⚙️  Configuration:");
  console.log("   Treasury:           ", treasuryAddress);
  console.log("   Oracle:             ", oracleAddress);
  console.log("   Admin:              ", adminAddress);
  console.log("\n💡 LP Vault Structure:");
  console.log("   Boost Vault:        70% of stakes");
  console.log("   Creator Vault:      30% of stakes");
  console.log("\n💰 Yield Engines:");
  console.log("   1. KAIDO Boost:     30% of treasury fees");
  console.log("   2. Creator Backing: 30% of (creator + affiliate) fees");
  console.log("   3. Engagement:      30% of campaign fees");
  console.log("\n" + "=".repeat(70));

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PredictionFactory: {
        address: predictionFactory.address,
        oracleAddress: oracleAddress,
      },
      FeeDistributor: {
        address: feeDistributor.address,
        lossEdgePool: lossEdgeVault.address,
        treasury: treasuryAddress,
      },
      LossEdgeVault: {
        address: lossEdgeVault.address,
      },
      LPVault: {
        address: lpVault.address,
        admin: adminAddress,
      }
    }
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const deploymentFile = path.join(deploymentsDir, `complete-system-${timestamp}.json`);
  const latestFile = path.join(deploymentsDir, "complete-system-latest.json");

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

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

