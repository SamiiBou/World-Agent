// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  World Chain Agent↔Human registry.
 *  Each agent address may call `link()` ONCE to bind itself to a
 *  unique human identifier (bytes32).  Immutable once set.
 */
contract AgentLinkRegistry {
    mapping(address => bytes32) public agentToHuman;   // agent ⇒ uniqueHash
    event Linked(address indexed agent, bytes32 indexed uniqueHash);

    function link(bytes32 uniqueHash) external {
        require(agentToHuman[msg.sender] == bytes32(0),
                "Agent already linked");
        agentToHuman[msg.sender] = uniqueHash;
        emit Linked(msg.sender, uniqueHash);
    }
}