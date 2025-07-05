const { ethers } = require("hardhat");
const deployments = require("../deployments.json");

async function main() {
  console.log("🔗 World-Agent contracts interaction script");

  if (!deployments.contracts) {
    console.error("❌ No deployed contracts found. Please deploy contracts first.");
    process.exit(1);
  }

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Main user:", deployer.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);

  // Connect to contracts
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = AgentRegistry.attach(deployments.contracts.AgentRegistry);

  const AgentDAO = await ethers.getContractFactory("AgentDAO");
  const agentDAO = AgentDAO.attach(deployments.contracts.AgentDAO);

  console.log("\n📋 Contract Information:");
  console.log("AgentRegistry:", await agentRegistry.getAddress());
  console.log("AgentDAO:", await agentDAO.getAddress());

  // Example interaction with AgentRegistry
  console.log("\n📝 Testing agent registration...");
  
  const agentAddress = user1.address; // Use user1 address as agent
  const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("worldid_demo_1"));
  const selfIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("selfid_demo_1"));
  const username = "agent_demo_1";

  try {
    // Check if agent is already registered
    const totalAgents = await agentRegistry.getTotalAgents();
    console.log("Current number of agents:", totalAgents.toString());

    // Check if username is available
    const usernameAvailable = await agentRegistry.isUsernameAvailable(username);
    console.log("Username available:", usernameAvailable);

    if (usernameAvailable) {
      console.log("Registering agent...");
      const tx = await agentRegistry.connect(deployer).registerAgent(
        agentAddress,
        worldIdNullifier,
        selfIdNullifier,
        username
      );
      await tx.wait();
      console.log("✅ Agent registered successfully!");
    } else {
      console.log("ℹ️  Username already in use, retrieving information...");
    }

    // Get agent information
    try {
      const agent = await agentRegistry.getAgent(agentAddress);
      console.log("\n📊 Agent Information:");
      console.log("  Address:", agent.agentAddress);
      console.log("  Owner:", agent.ownerWallet);
      console.log("  Username:", agent.username);
      console.log("  Active:", agent.isActive);
      console.log("  Registration Date:", new Date(Number(agent.registrationTime) * 1000).toLocaleString());
    } catch (error) {
      console.log("❌ Agent not found");
    }

    // Global statistics
    const totalAgentsAfter = await agentRegistry.getTotalAgents();
    console.log("\n📈 Global Statistics:");
    console.log("Total agents:", totalAgentsAfter.toString());

    // Example interaction with AgentDAO
    console.log("\n🗳️  Testing DAO...");
    
    // Check voting weight
    const votingWeight = await agentDAO.getVotingWeight(deployer.address);
    console.log("Deployer voting weight:", votingWeight.toString());

    // Create a test proposal (only if user has agents)
    if (votingWeight > 0) {
      const proposalCount = await agentDAO.proposalCount();
      console.log("Current number of proposals:", proposalCount.toString());

      if (proposalCount == 0) {
        console.log("Creating test proposal...");
        const tx = await agentDAO.connect(deployer).createProposal(
          "Test Proposal",
          "This is a test proposal to demonstrate DAO functionality",
          0, // GENERAL
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        );
        await tx.wait();
        console.log("✅ Proposal created successfully!");

        // Get proposal details
        const proposal = await agentDAO.getProposal(1);
        console.log("\n📋 Proposal Details:");
        console.log("  ID:", proposal.id.toString());
        console.log("  Title:", proposal.title);
        console.log("  Description:", proposal.description);
        console.log("  Proposer:", proposal.proposer);
        console.log("  Start:", new Date(Number(proposal.startTime) * 1000).toLocaleString());
        console.log("  End:", new Date(Number(proposal.endTime) * 1000).toLocaleString());
      }
    } else {
      console.log("ℹ️  No agents registered, cannot create proposals");
    }

    // Treasury statistics
    const treasuryBalance = await agentDAO.getTreasuryBalance();
    console.log("\n💰 Treasury Balance:", ethers.formatEther(treasuryBalance), "ETH");

  } catch (error) {
    console.error("❌ Interaction error:", error.message);
  }

  console.log("\n🎉 Interaction script completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 