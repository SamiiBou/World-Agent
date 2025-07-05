// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @dev Contract for registering AI agents on World Chain
 * @notice Allows multiple agents per World ID and Self ID user
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    
    struct Agent {
        address agentAddress;           // Agent's Worldchain address
        address ownerWallet;           // Owner's wallet address
        bytes32 worldIdNullifier;     // World ID nullifier hash (can be reused)
        bytes32 selfIdNullifier;      // Self ID nullifier hash (can be reused)
        uint256 registrationTime;     // Registration timestamp
        bool isActive;                // Active/inactive status
        string username;              // Username (must be unique)
    }

    // Mapping of agents by address
    mapping(address => Agent) public agents;
    
    // Mapping to verify username uniqueness (usernames must still be unique)
    mapping(string => bool) public usernameUsed;
    
    // List of registered agent addresses
    address[] public agentAddresses;
    
    // Events
    event AgentRegistered(
        address indexed agentAddress,
        address indexed ownerWallet,
        string username,
        bytes32 worldIdNullifier,
        bytes32 selfIdNullifier
    );
    
    event AgentDeactivated(address indexed agentAddress);
    event AgentReactivated(address indexed agentAddress);
    event AgentUpdated(address indexed agentAddress, string newUsername);

    // Modifiers
    modifier onlyAgentOwner(address agentAddress) {
        require(agents[agentAddress].ownerWallet == msg.sender, "Not the agent owner");
        _;
    }

    modifier agentExists(address agentAddress) {
        require(agents[agentAddress].agentAddress != address(0), "Agent does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new AI agent
     * @param agentAddress The agent's address
     * @param worldIdNullifier The World ID nullifier
     * @param selfIdNullifier The Self ID nullifier
     * @param username The username
     */
    function registerAgent(
        address agentAddress,
        bytes32 worldIdNullifier,
        bytes32 selfIdNullifier,
        string calldata username
    ) external nonReentrant {
        require(agentAddress != address(0), "Invalid agent address");
        require(agents[agentAddress].agentAddress == address(0), "Agent already registered");
        require(!usernameUsed[username], "Username already taken");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= 50, "Username too long");

        // Create the agent
        Agent memory newAgent = Agent({
            agentAddress: agentAddress,
            ownerWallet: msg.sender,
            worldIdNullifier: worldIdNullifier,
            selfIdNullifier: selfIdNullifier,
            registrationTime: block.timestamp,
            isActive: true,
            username: username
        });

        // Register the agent
        agents[agentAddress] = newAgent;
        agentAddresses.push(agentAddress);
        
        // Mark username as used (usernames must be unique)
        usernameUsed[username] = true;

        emit AgentRegistered(agentAddress, msg.sender, username, worldIdNullifier, selfIdNullifier);
    }

    /**
     * @dev Deactivate an agent
     * @param agentAddress The agent's address to deactivate
     */
    function deactivateAgent(address agentAddress) 
        external 
        onlyAgentOwner(agentAddress) 
        agentExists(agentAddress) 
    {
        agents[agentAddress].isActive = false;
        emit AgentDeactivated(agentAddress);
    }

    /**
     * @dev Reactivate an agent
     * @param agentAddress The agent's address to reactivate
     */
    function reactivateAgent(address agentAddress) 
        external 
        onlyAgentOwner(agentAddress) 
        agentExists(agentAddress) 
    {
        agents[agentAddress].isActive = true;
        emit AgentReactivated(agentAddress);
    }

    /**
     * @dev Update an agent's username
     * @param agentAddress The agent's address
     * @param newUsername The new username
     */
    function updateUsername(address agentAddress, string calldata newUsername) 
        external 
        onlyAgentOwner(agentAddress) 
        agentExists(agentAddress) 
    {
        require(!usernameUsed[newUsername], "Username already taken");
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(bytes(newUsername).length <= 50, "Username too long");

        // Release the old username
        usernameUsed[agents[agentAddress].username] = false;
        
        // Assign the new username
        agents[agentAddress].username = newUsername;
        usernameUsed[newUsername] = true;

        emit AgentUpdated(agentAddress, newUsername);
    }

    /**
     * @dev Get agent information
     * @param agentAddress The agent's address
     * @return Agent The agent information
     */
    function getAgent(address agentAddress) external view returns (Agent memory) {
        require(agents[agentAddress].agentAddress != address(0), "Agent does not exist");
        return agents[agentAddress];
    }

    /**
     * @dev Get all agents of an owner
     * @param ownerWallet The owner's address
     * @return address[] The agent addresses
     */
    function getAgentsByOwner(address ownerWallet) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count the owner's agents
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].ownerWallet == ownerWallet) {
                count++;
            }
        }
        
        // Create the result array
        address[] memory ownerAgents = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].ownerWallet == ownerWallet) {
                ownerAgents[index] = agentAddresses[i];
                index++;
            }
        }
        
        return ownerAgents;
    }

    /**
     * @dev Get all agents by World ID nullifier
     * @param worldIdNullifier The World ID nullifier
     * @return address[] The agent addresses
     */
    function getAgentsByWorldIdNullifier(bytes32 worldIdNullifier) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count the agents with this World ID nullifier
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].worldIdNullifier == worldIdNullifier) {
                count++;
            }
        }
        
        // Create the result array
        address[] memory worldIdAgents = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].worldIdNullifier == worldIdNullifier) {
                worldIdAgents[index] = agentAddresses[i];
                index++;
            }
        }
        
        return worldIdAgents;
    }

    /**
     * @dev Get all agents by Self ID nullifier
     * @param selfIdNullifier The Self ID nullifier
     * @return address[] The agent addresses
     */
    function getAgentsBySelfIdNullifier(bytes32 selfIdNullifier) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count the agents with this Self ID nullifier
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].selfIdNullifier == selfIdNullifier) {
                count++;
            }
        }
        
        // Create the result array
        address[] memory selfIdAgents = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            if (agents[agentAddresses[i]].selfIdNullifier == selfIdNullifier) {
                selfIdAgents[index] = agentAddresses[i];
                index++;
            }
        }
        
        return selfIdAgents;
    }

    /**
     * @dev Get the total number of registered agents
     * @return uint256 The number of agents
     */
    function getTotalAgents() external view returns (uint256) {
        return agentAddresses.length;
    }

    /**
     * @dev Get all agent addresses
     * @return address[] The agent addresses
     */
    function getAllAgentAddresses() external view returns (address[] memory) {
        return agentAddresses;
    }

    /**
     * @dev Check if an agent is active
     * @param agentAddress The agent's address
     * @return bool True if the agent is active
     */
    function isAgentActive(address agentAddress) external view returns (bool) {
        return agents[agentAddress].isActive;
    }

    /**
     * @dev Check if a username is available
     * @param username The username to check
     * @return bool True if the username is available
     */
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        return !usernameUsed[username];
    }
} 