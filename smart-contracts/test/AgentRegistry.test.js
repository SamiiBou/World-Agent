const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  let AgentRegistry, agentRegistry;
  let owner, addr1, addr2, agent1, agent2;

  beforeEach(async function () {
    // Deploy the contract
    AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    [owner, addr1, addr2, agent1, agent2] = await ethers.getSigners();
    
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await agentRegistry.owner()).to.equal(owner.address);
    });

    it("Should have zero agents initially", async function () {
      expect(await agentRegistry.getTotalAgents()).to.equal(0);
    });
  });

  describe("Agent Registration", function () {
    it("Should register a new agent", async function () {
      const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const username = "agent1";

      await expect(
        agentRegistry.connect(addr1).registerAgent(
          agent1.address,
          worldIdNullifier,
          selfIdNullifier,
          username
        )
      ).to.emit(agentRegistry, "AgentRegistered")
        .withArgs(agent1.address, addr1.address, username, worldIdNullifier, selfIdNullifier);

      expect(await agentRegistry.getTotalAgents()).to.equal(1);
    });

    it("Should not allow registering an agent with null address", async function () {
      const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const username = "agent1";

      await expect(
        agentRegistry.connect(addr1).registerAgent(
          ethers.ZeroAddress,
          worldIdNullifier,
          selfIdNullifier,
          username
        )
      ).to.be.revertedWith("Invalid agent address");
    });

    it("Should not allow registering an already existing agent", async function () {
      const worldIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const worldIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("worldid2"));
      const selfIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("selfid2"));
      const username1 = "agent1";
      const username2 = "agent2";

      // First registration
      await agentRegistry.connect(addr1).registerAgent(
        agent1.address,
        worldIdNullifier1,
        selfIdNullifier1,
        username1
      );

      // Attempt second registration with same agent address
      await expect(
        agentRegistry.connect(addr2).registerAgent(
          agent1.address,
          worldIdNullifier2,
          selfIdNullifier2,
          username2
        )
      ).to.be.revertedWith("Agent already registered");
    });

    it("Should not allow using the same World ID nullifier", async function () {
      const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const selfIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("selfid2"));
      const username1 = "agent1";
      const username2 = "agent2";

      // First registration
      await agentRegistry.connect(addr1).registerAgent(
        agent1.address,
        worldIdNullifier,
        selfIdNullifier1,
        username1
      );

      // Attempt with same World ID nullifier
      await expect(
        agentRegistry.connect(addr2).registerAgent(
          agent2.address,
          worldIdNullifier,
          selfIdNullifier2,
          username2
        )
      ).to.be.revertedWith("World ID nullifier already used");
    });

    it("Should not allow using the same username", async function () {
      const worldIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const worldIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("worldid2"));
      const selfIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("selfid2"));
      const username = "agent1";

      // First registration
      await agentRegistry.connect(addr1).registerAgent(
        agent1.address,
        worldIdNullifier1,
        selfIdNullifier1,
        username
      );

      // Attempt with same username
      await expect(
        agentRegistry.connect(addr2).registerAgent(
          agent2.address,
          worldIdNullifier2,
          selfIdNullifier2,
          username
        )
      ).to.be.revertedWith("Username already taken");
    });
  });

  describe("Agent Management", function () {
    beforeEach(async function () {
      // Register an agent for testing
      const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const username = "agent1";

      await agentRegistry.connect(addr1).registerAgent(
        agent1.address,
        worldIdNullifier,
        selfIdNullifier,
        username
      );
    });

    it("Should allow owner to deactivate their agent", async function () {
      await expect(
        agentRegistry.connect(addr1).deactivateAgent(agent1.address)
      ).to.emit(agentRegistry, "AgentDeactivated")
        .withArgs(agent1.address);

      expect(await agentRegistry.isAgentActive(agent1.address)).to.be.false;
    });

    it("Should allow owner to reactivate their agent", async function () {
      await agentRegistry.connect(addr1).deactivateAgent(agent1.address);
      
      await expect(
        agentRegistry.connect(addr1).reactivateAgent(agent1.address)
      ).to.emit(agentRegistry, "AgentReactivated")
        .withArgs(agent1.address);

      expect(await agentRegistry.isAgentActive(agent1.address)).to.be.true;
    });

    it("Should not allow non-owner to deactivate an agent", async function () {
      await expect(
        agentRegistry.connect(addr2).deactivateAgent(agent1.address)
      ).to.be.revertedWith("Not the agent owner");
    });

    it("Should allow updating username", async function () {
      const newUsername = "newAgent1";
      
      await expect(
        agentRegistry.connect(addr1).updateUsername(agent1.address, newUsername)
      ).to.emit(agentRegistry, "AgentUpdated")
        .withArgs(agent1.address, newUsername);

      const agent = await agentRegistry.getAgent(agent1.address);
      expect(agent.username).to.equal(newUsername);
    });
  });

  describe("Views", function () {
    beforeEach(async function () {
      // Register some agents
      const worldIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("worldid1"));
      const selfIdNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("selfid1"));
      const worldIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("worldid2"));
      const selfIdNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("selfid2"));

      await agentRegistry.connect(addr1).registerAgent(
        agent1.address,
        worldIdNullifier1,
        selfIdNullifier1,
        "agent1"
      );

      await agentRegistry.connect(addr1).registerAgent(
        agent2.address,
        worldIdNullifier2,
        selfIdNullifier2,
        "agent2"
      );
    });

    it("Should retrieve agent information", async function () {
      const agent = await agentRegistry.getAgent(agent1.address);
      
      expect(agent.agentAddress).to.equal(agent1.address);
      expect(agent.ownerWallet).to.equal(addr1.address);
      expect(agent.username).to.equal("agent1");
      expect(agent.isActive).to.be.true;
    });

    it("Should retrieve owner's agents", async function () {
      const ownerAgents = await agentRegistry.getAgentsByOwner(addr1.address);
      
      expect(ownerAgents.length).to.equal(2);
      expect(ownerAgents).to.include(agent1.address);
      expect(ownerAgents).to.include(agent2.address);
    });

    it("Should check username availability", async function () {
      expect(await agentRegistry.isUsernameAvailable("agent1")).to.be.false;
      expect(await agentRegistry.isUsernameAvailable("availableUsername")).to.be.true;
    });
  });
}); 