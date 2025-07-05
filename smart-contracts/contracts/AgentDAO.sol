// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentRegistry.sol";

/**
 * @title AgentDAO
 * @dev DAO contract for voting on agent-related proposals
 */
contract AgentDAO is Ownable, ReentrancyGuard {
    
    AgentRegistry public agentRegistry;
    
    enum ProposalType {
        GENERAL,           // General proposal
        AGENT_REMOVAL,     // Agent removal
        PARAMETER_CHANGE,  // Parameter change
        TREASURY_SPEND     // Treasury spending
    }

    enum VoteChoice {
        ABSTAIN,
        FOR,
        AGAINST
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        ProposalType proposalType;
        address proposer;
        address targetAgent;        // For agent-related proposals
        uint256 amount;            // For spending proposals
        address recipient;         // For spending proposals
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasVoted;
        mapping(address => VoteChoice) votes;
    }

    // DAO parameters
    uint256 public votingDuration = 7 days;        // Default voting duration
    uint256 public proposalThreshold = 1;          // Minimum number of agents to propose
    uint256 public quorumPercentage = 20;          // Minimum participation percentage
    uint256 public passingPercentage = 50;         // Minimum percentage to pass

    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256[] public proposalIds;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        ProposalType proposalType,
        address indexed proposer,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 weight
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    // Modifiers
    modifier onlyAgentOwner() {
        require(isAgentOwner(msg.sender), "Must be an agent owner");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        _;
    }

    modifier votingActive(uint256 proposalId) {
        require(
            block.timestamp >= proposals[proposalId].startTime && 
            block.timestamp <= proposals[proposalId].endTime,
            "Voting is not active"
        );
        _;
    }

    modifier votingEnded(uint256 proposalId) {
        require(block.timestamp > proposals[proposalId].endTime, "Voting is still active");
        _;
    }

    modifier notExecuted(uint256 proposalId) {
        require(!proposals[proposalId].executed, "Proposal already executed");
        _;
    }

    modifier notCancelled(uint256 proposalId) {
        require(!proposals[proposalId].cancelled, "Proposal is cancelled");
        _;
    }

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    /**
     * @dev Create a new proposal
     * @param title The proposal title
     * @param description The proposal description
     * @param proposalType The proposal type
     * @param targetAgent The target agent (for certain types)
     * @param amount The amount (for spending)
     * @param recipient The recipient (for spending)
     */
    function createProposal(
        string calldata title,
        string calldata description,
        ProposalType proposalType,
        address targetAgent,
        uint256 amount,
        address recipient
    ) external onlyAgentOwner {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        if (proposalType == ProposalType.AGENT_REMOVAL) {
            require(targetAgent != address(0), "Target agent required for removal");
        }
        
        if (proposalType == ProposalType.TREASURY_SPEND) {
            require(amount > 0, "Amount must be greater than 0");
            require(recipient != address(0), "Recipient required for treasury spend");
        }

        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.proposalType = proposalType;
        newProposal.proposer = msg.sender;
        newProposal.targetAgent = targetAgent;
        newProposal.amount = amount;
        newProposal.recipient = recipient;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingDuration;
        newProposal.executed = false;
        newProposal.cancelled = false;
        
        proposalIds.push(proposalId);

        emit ProposalCreated(
            proposalId,
            title,
            proposalType,
            msg.sender,
            newProposal.startTime,
            newProposal.endTime
        );
    }

    /**
     * @dev Vote on a proposal
     * @param proposalId The proposal ID
     * @param choice The vote choice
     */
    function vote(uint256 proposalId, VoteChoice choice) 
        external 
        onlyAgentOwner
        proposalExists(proposalId)
        votingActive(proposalId)
        notCancelled(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = getVotingWeight(msg.sender);
        require(weight > 0, "No voting weight");

        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = choice;

        if (choice == VoteChoice.FOR) {
            proposal.votesFor += weight;
        } else if (choice == VoteChoice.AGAINST) {
            proposal.votesAgainst += weight;
        } else {
            proposal.votesAbstain += weight;
        }

        emit VoteCast(proposalId, msg.sender, choice, weight);
    }

    /**
     * @dev Execute a proposal if it's approved
     * @param proposalId The proposal ID
     */
    function executeProposal(uint256 proposalId) 
        external 
        proposalExists(proposalId)
        votingEnded(proposalId)
        notExecuted(proposalId)
        notCancelled(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        require(isProposalApproved(proposalId), "Proposal not approved");
        
        proposal.executed = true;
        
        // Execute based on proposal type
        if (proposal.proposalType == ProposalType.AGENT_REMOVAL) {
            // Logic to remove an agent (deactivate in registry)
            // Note: This would require a function in AgentRegistry
        } else if (proposal.proposalType == ProposalType.TREASURY_SPEND) {
            // Send funds from treasury
            require(address(this).balance >= proposal.amount, "Insufficient treasury balance");
            payable(proposal.recipient).transfer(proposal.amount);
        }
        
        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (owner only)
     * @param proposalId The proposal ID
     */
    function cancelProposal(uint256 proposalId) 
        external 
        onlyOwner
        proposalExists(proposalId)
        notExecuted(proposalId)
        notCancelled(proposalId)
    {
        proposals[proposalId].cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    /**
     * @dev Check if a proposal is approved
     * @param proposalId The proposal ID
     * @return bool True if approved
     */
    function isProposalApproved(uint256 proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        uint256 totalPossibleVotes = getTotalVotingWeight();
        
        // Check quorum
        if (totalPossibleVotes == 0) return false;
        uint256 participationRate = (totalVotes * 100) / totalPossibleVotes;
        if (participationRate < quorumPercentage) return false;
        
        // Check passing percentage
        if (proposal.votesFor + proposal.votesAgainst == 0) return false;
        uint256 approvalRate = (proposal.votesFor * 100) / (proposal.votesFor + proposal.votesAgainst);
        
        return approvalRate >= passingPercentage;
    }

    /**
     * @dev Get a user's voting weight
     * @param user The user's address
     * @return uint256 The voting weight
     */
    function getVotingWeight(address user) public view returns (uint256) {
        // Each agent gives a voting weight of 1
        return agentRegistry.getAgentsByOwner(user).length;
    }

    /**
     * @dev Get the total possible voting weight
     * @return uint256 The total weight
     */
    function getTotalVotingWeight() public view returns (uint256) {
        return agentRegistry.getTotalAgents();
    }

    /**
     * @dev Check if a user owns agents
     * @param user The user's address
     * @return bool True if owns agents
     */
    function isAgentOwner(address user) public view returns (bool) {
        return getVotingWeight(user) > 0;
    }

    /**
     * @dev Get proposal details
     * @param proposalId The proposal ID
     * @return id ID of the proposal
     * @return title Title of the proposal
     * @return description Description of the proposal
     * @return proposalType Type of proposal
     * @return proposer Address of the proposer
     * @return targetAgent Target agent
     * @return amount Requested amount
     * @return recipient Recipient address
     * @return startTime Start time
     * @return endTime End time
     * @return votesFor Votes for
     * @return votesAgainst Votes against
     * @return votesAbstain Abstain votes
     * @return executed Execution status
     * @return cancelled Cancellation status
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        ProposalType proposalType,
        address proposer,
        address targetAgent,
        uint256 amount,
        address recipient,
        uint256 startTime,
        uint256 endTime,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        bool executed,
        bool cancelled
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.proposer,
            proposal.targetAgent,
            proposal.amount,
            proposal.recipient,
            proposal.startTime,
            proposal.endTime,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.votesAbstain,
            proposal.executed,
            proposal.cancelled
        );
    }

    /**
     * @dev Get all proposal IDs
     * @return uint256[] The proposal IDs
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposalIds;
    }

    /**
     * @dev Update DAO parameters (owner only)
     * @param _votingDuration New voting duration
     * @param _quorumPercentage New quorum percentage
     * @param _passingPercentage New passing percentage
     */
    function updateDAOParameters(
        uint256 _votingDuration,
        uint256 _quorumPercentage,
        uint256 _passingPercentage
    ) external onlyOwner {
        require(_votingDuration > 0, "Voting duration must be positive");
        require(_quorumPercentage <= 100, "Quorum percentage cannot exceed 100");
        require(_passingPercentage <= 100, "Passing percentage cannot exceed 100");
        
        votingDuration = _votingDuration;
        quorumPercentage = _quorumPercentage;
        passingPercentage = _passingPercentage;
    }

    /**
     * @dev Allow receiving ETH into the treasury
     */
    receive() external payable {}

    /**
     * @dev Get the treasury balance
     * @return uint256 The balance in wei
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 