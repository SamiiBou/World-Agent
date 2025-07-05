const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting World-Agent contracts deployment...");

  // Get the deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy AgentRegistry
  console.log("\n📝 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

  // Deploy AgentDAO
  console.log("\n🗳️  Deploying AgentDAO...");
  const AgentDAO = await ethers.getContractFactory("AgentDAO");
  const agentDAO = await AgentDAO.deploy(agentRegistryAddress);
  await agentDAO.waitForDeployment();
  
  const agentDAOAddress = await agentDAO.getAddress();
  console.log("✅ AgentDAO deployed to:", agentDAOAddress);

  // Display deployment information
  console.log("\n📋 Deployment Summary:");
  console.log("==========================================");
  console.log("Network:", (await deployer.provider.getNetwork()).name);
  console.log("AgentRegistry:", agentRegistryAddress);
  console.log("AgentDAO:", agentDAOAddress);
  console.log("Deployer:", deployer.address);
  console.log("==========================================");

  // Save addresses to file
  const fs = require('fs');
  const deploymentInfo = {
    network: (await deployer.provider.getNetwork()).name,
    chainId: (await deployer.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      AgentRegistry: agentRegistryAddress,
      AgentDAO: agentDAOAddress
    },
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📄 Deployment info saved to deployments.json");

  // Verify contracts (optional)
  console.log("\n🔍 Verifying contracts...");
  try {
    // Simple test to verify contracts are functional
    const totalAgents = await agentRegistry.getTotalAgents();
    console.log("✅ AgentRegistry functional - Total agents:", totalAgents.toString());
    
    const treasuryBalance = await agentDAO.getTreasuryBalance();
    console.log("✅ AgentDAO functional - Treasury balance:", ethers.formatEther(treasuryBalance), "ETH");
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment error:", error);
    process.exit(1);
  }); 