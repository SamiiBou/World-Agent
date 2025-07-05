const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentDAO", function () {
  let AgentRegistry, agentRegistry, AgentDAO, agentDAO;
  let owner, addr1, addr2, addr3, agent1, agent2;

  beforeEach(async function () {
    // Deploy contracts
    [owner, addr1, addr2, addr3, agent1, agent2] = await ethers.getSigners();
    
    AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();

    AgentDAO = await ethers.getContractFactory("AgentDAO");
    agentDAO = await AgentDAO.deploy(await agentRegistry.getAddress());
    await agentDAO.waitForDeployment();

    // Register some agents for testing
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

    await agentRegistry.connect(addr2).registerAgent(
      agent2.address,
      worldIdNullifier2,
      selfIdNullifier2,
      "agent2"
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await agentDAO.owner()).to.equal(owner.address);
    });

    it("Should have a reference to the agent registry", async function () {
      expect(await agentDAO.agentRegistry()).to.equal(await agentRegistry.getAddress());
    });

    it("Should have zero proposals initially", async function () {
      expect(await agentDAO.proposalCount()).to.equal(0);
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow agent owner to create a proposal", async function () {
      const title = "Test Proposal";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await expect(
        agentDAO.connect(addr1).createProposal(
          title,
          description,
          proposalType,
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        )
      ).to.emit(agentDAO, "ProposalCreated");

      expect(await agentDAO.proposalCount()).to.equal(1);
    });

    it("Should not allow non-agent owner to create a proposal", async function () {
      const title = "Test Proposal";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await expect(
        agentDAO.connect(addr3).createProposal(
          title,
          description,
          proposalType,
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Must be an agent owner");
    });

    it("Should not allow creating a proposal with empty title", async function () {
      const title = "";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await expect(
        agentDAO.connect(addr1).createProposal(
          title,
          description,
          proposalType,
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should require target agent for removal proposal", async function () {
      const title = "Remove Agent";
      const description = "Removal description";
      const proposalType = 1; // AGENT_REMOVAL

      await expect(
        agentDAO.connect(addr1).createProposal(
          title,
          description,
          proposalType,
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Target agent required for removal");
    });

    it("Should require amount and recipient for treasury spend", async function () {
      const title = "Treasury Spend";
      const description = "Spend description";
      const proposalType = 3; // TREASURY_SPEND

      await expect(
        agentDAO.connect(addr1).createProposal(
          title,
          description,
          proposalType,
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Voting", function () {
    let proposalId;

    beforeEach(async function () {
      // Create a proposal for testing
      const title = "Test Proposal";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await agentDAO.connect(addr1).createProposal(
        title,
        description,
        proposalType,
        ethers.ZeroAddress,
        0,
        ethers.ZeroAddress
      );

      proposalId = 1;
    });

    it("Should allow agent owner to vote", async function () {
      const choice = 1; // FOR

      await expect(
        agentDAO.connect(addr1).vote(proposalId, choice)
      ).to.emit(agentDAO, "VoteCast")
        .withArgs(proposalId, addr1.address, choice, 1);
    });

    it("Should not allow non-agent owner to vote", async function () {
      const choice = 1; // FOR

      await expect(
        agentDAO.connect(addr3).vote(proposalId, choice)
      ).to.be.revertedWith("Must be an agent owner");
    });

    it("Should not allow voting twice", async function () {
      const choice = 1; // FOR

      await agentDAO.connect(addr1).vote(proposalId, choice);

      await expect(
        agentDAO.connect(addr1).vote(proposalId, choice)
      ).to.be.revertedWith("Already voted");
    });

    it("Should calculate voting weight correctly", async function () {
      // addr1 has 1 agent, so voting weight = 1
      expect(await agentDAO.getVotingWeight(addr1.address)).to.equal(1);
      
      // addr2 has 1 agent, so voting weight = 1
      expect(await agentDAO.getVotingWeight(addr2.address)).to.equal(1);
      
      // addr3 has no agents, so voting weight = 0
      expect(await agentDAO.getVotingWeight(addr3.address)).to.equal(0);
    });
  });

  describe("Proposal Approval", function () {
    let proposalId;

    beforeEach(async function () {
      // Create a proposal for testing
      const title = "Test Proposal";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await agentDAO.connect(addr1).createProposal(
        title,
        description,
        proposalType,
        ethers.ZeroAddress,
        0,
        ethers.ZeroAddress
      );

      proposalId = 1;
    });

    it("Should correctly calculate proposal approval", async function () {
      // Vote for the proposal
      await agentDAO.connect(addr1).vote(proposalId, 1); // FOR
      await agentDAO.connect(addr2).vote(proposalId, 1); // FOR

      // Wait for voting period to end
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]); // 7 days + 1 second
      await ethers.provider.send("evm_mine", []);

      // Check that proposal is approved
      expect(await agentDAO.isProposalApproved(proposalId)).to.be.true;
    });

    it("Should not approve proposal without quorum", async function () {
      // No votes
      
      // Wait for voting period to end
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Check that proposal is not approved
      expect(await agentDAO.isProposalApproved(proposalId)).to.be.false;
    });
  });

  describe("Treasury Management", function () {
    it("Should allow receiving ETH", async function () {
      const amount = ethers.parseEther("1.0");
      
      await addr1.sendTransaction({
        to: await agentDAO.getAddress(),
        value: amount
      });

      expect(await agentDAO.getTreasuryBalance()).to.equal(amount);
    });

    it("Should allow treasury spending via proposal", async function () {
      // Add funds to treasury
      const treasuryAmount = ethers.parseEther("2.0");
      await addr1.sendTransaction({
        to: await agentDAO.getAddress(),
        value: treasuryAmount
      });

      // Create spending proposal
      const spendAmount = ethers.parseEther("1.0");
      await agentDAO.connect(addr1).createProposal(
        "Treasury Spend",
        "Spend 1 ETH",
        3, // TREASURY_SPEND
        ethers.ZeroAddress,
        spendAmount,
        addr3.address
      );

      const proposalId = 1;

      // Vote for the proposal
      await agentDAO.connect(addr1).vote(proposalId, 1); // FOR
      await agentDAO.connect(addr2).vote(proposalId, 1); // FOR

      // Wait for voting period to end
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Execute the proposal
      const balanceBefore = await addr3.provider.getBalance(addr3.address);
      
      await expect(
        agentDAO.connect(owner).executeProposal(proposalId)
      ).to.emit(agentDAO, "ProposalExecuted")
        .withArgs(proposalId);

      const balanceAfter = await addr3.provider.getBalance(addr3.address);
      expect(balanceAfter - balanceBefore).to.equal(spendAmount);
    });
  });

  describe("Views", function () {
    it("Should retrieve proposal details", async function () {
      const title = "Test Proposal";
      const description = "Test proposal description";
      const proposalType = 0; // GENERAL

      await agentDAO.connect(addr1).createProposal(
        title,
        description,
        proposalType,
        ethers.ZeroAddress,
        0,
        ethers.ZeroAddress
      );

      const proposalId = 1;
      const proposal = await agentDAO.getProposal(proposalId);

      expect(proposal.id).to.equal(proposalId);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.proposalType).to.equal(proposalType);
      expect(proposal.proposer).to.equal(addr1.address);
      expect(proposal.executed).to.be.false;
      expect(proposal.cancelled).to.be.false;
    });

    it("Should retrieve all proposal IDs", async function () {
      // Create some proposals
      await agentDAO.connect(addr1).createProposal(
        "Proposal 1",
        "Description 1",
        0,
        ethers.ZeroAddress,
        0,
        ethers.ZeroAddress
      );

      await agentDAO.connect(addr2).createProposal(
        "Proposal 2",
        "Description 2",
        0,
        ethers.ZeroAddress,
        0,
        ethers.ZeroAddress
      );

      const proposalIds = await agentDAO.getAllProposalIds();
      expect(proposalIds.length).to.equal(2);
      expect(proposalIds[0]).to.equal(1);
      expect(proposalIds[1]).to.equal(2);
    });
  });
}); 