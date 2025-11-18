const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying KAIDO Prediction System to BSC Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Get treasury address from wasp.json
  const waspConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../backend/wasp.json"), "utf8")
  );
  const treasuryAddress = waspConfig.kaidoTreasury.address;
  console.log("Treasury address:", treasuryAddress);

  // Step 1: Deploy LossEdgeVault
  console.log("\n📦 Deploying LossEdgeVault...");
  const LossEdgeVault = await ethers.getContractFactory("LossEdgeVault");
  const lossEdgeVault = await LossEdgeVault.deploy();
  await lossEdgeVault.deployed();
  console.log("✅ LossEdgeVault deployed to:", lossEdgeVault.address);

  // Step 2: Deploy FeeDistributor
  console.log("\n📦 Deploying FeeDistributor...");
  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await FeeDistributor.deploy(
    lossEdgeVault.address,
    treasuryAddress
  );
  await feeDistributor.deployed();
  console.log("✅ FeeDistributor deployed to:", feeDistributor.address);

  // Step 3: Deploy PredictionFactory
  console.log("\n📦 Deploying PredictionFactory...");
  const PredictionFactory = await ethers.getContractFactory("PredictionFactory");
  
  // Oracle address will be the deployer for now (will be updated later)
  const oracleAddress = deployer.address;
  
  const predictionFactory = await PredictionFactory.deploy(
    oracleAddress,
    feeDistributor.address
  );
  await predictionFactory.deployed();
  console.log("✅ PredictionFactory deployed to:", predictionFactory.address);

  // Step 4: Configure contracts
  console.log("\n⚙️  Configuring contracts...");

  // Set PredictionFactory address in FeeDistributor
  const tx1 = await feeDistributor.setPredictionFactory(predictionFactory.address);
  await tx1.wait();
  console.log("✅ FeeDistributor configured with PredictionFactory");

  // Set PredictionFactory address in LossEdgeVault
  const tx2 = await lossEdgeVault.setPredictionFactory(predictionFactory.address);
  await tx2.wait();
  console.log("✅ LossEdgeVault configured with PredictionFactory");

  // Step 5: Save deployment info
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
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `prediction-system-${timestamp}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  // Also save as latest
  const latestPath = path.join(deploymentsDir, "prediction-system-latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", filename);

  // Step 6: Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   PredictionFactory:", predictionFactory.address);
  console.log("   FeeDistributor:   ", feeDistributor.address);
  console.log("   LossEdgeVault:    ", lossEdgeVault.address);
  console.log("\n⚙️  Configuration:");
  console.log("   Oracle Address:   ", oracleAddress);
  console.log("   Treasury Address: ", treasuryAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update backend .env with contract addresses");
  console.log("   2. Create oracle wallet and update oracle address");
  console.log("   3. Verify contracts on BSCScan:");
  console.log(`      npx hardhat verify --network bscTestnet ${predictionFactory.address} "${oracleAddress}" "${feeDistributor.address}"`);
  console.log(`      npx hardhat verify --network bscTestnet ${feeDistributor.address} "${lossEdgeVault.address}" "${treasuryAddress}"`);
  console.log(`      npx hardhat verify --network bscTestnet ${lossEdgeVault.address}`);
  console.log("\n" + "=".repeat(60) + "\n");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

