const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Configuring LP Vault in PredictionFactory...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Load LP Vault deployment
  const lpDeploymentPath = path.join(__dirname, "../deployments/lp-vault-latest.json");
  const lpDeployment = JSON.parse(fs.readFileSync(lpDeploymentPath, "utf8"));
  
  const LP_VAULT = lpDeployment.contracts.LPVault;
  const PREDICTION_FACTORY = lpDeployment.contracts.PredictionFactory;

  console.log("📋 Contract Addresses:");
  console.log("   LPVault:           ", LP_VAULT);
  console.log("   PredictionFactory: ", PREDICTION_FACTORY);
  console.log("");

  // Get PredictionFactory contract
  const predictionFactory = await ethers.getContractAt("PredictionFactory", PREDICTION_FACTORY);

  // Check current owner
  try {
    const currentOwner = await predictionFactory.owner();
    console.log("Current PredictionFactory owner:", currentOwner);
    console.log("Deployer address:              ", deployer.address);
    console.log("");
  } catch (error) {
    console.log("Could not get owner (contract may not have owner() function)");
  }

  // Try to set LP Vault
  console.log("Setting LPVault address in PredictionFactory...");
  try {
    const tx = await predictionFactory.setLPVault(LP_VAULT, {
      gasLimit: 100000
    });
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ LPVault address set successfully!");
  } catch (error) {
    console.error("❌ Failed to set LPVault:");
    console.error(error.message);
    
    // Try to get more details
    if (error.error && error.error.data) {
      console.log("\nError data:", error.error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

