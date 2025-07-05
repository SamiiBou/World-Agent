#!/usr/bin/env node

/**
 * Test script to verify agent responses after improvements
 */

const { config } = require('./src/config/environment');

// Simulated agent service for testing
class TestAgentService {
  generateSimulatedResponse(message, selectedAgent) {
    const lowerMessage = message.toLowerCase();
    
    // Casual greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const agentName = selectedAgent ? selectedAgent.name : config.agent.name;
      const avatar = selectedAgent ? selectedAgent.avatar : '🤖';
      return `Hey there! I'm ${agentName} ${avatar}. I'm here to help with Web3 operations, file management, and API calls. What can I do for you today?`;
    }
    
    // Personal questions
    if (lowerMessage.includes('how are you') || lowerMessage.includes('what\'s up') || lowerMessage.includes('how old are you')) {
      return `I'm doing great, thanks for asking! I'm an AI agent built to help with Web3 and automation tasks. I'm always ready to assist you with blockchain operations, file management, or API calls. What would you like to work on?`;
    }
    
    // Age-related questions
    if (lowerMessage.includes('age') || lowerMessage.includes('old')) {
      return `I'm a digital AI agent, so I don't have an age in the traditional sense! But I was created to help with Web3 operations and automation. I'm constantly learning and improving. How can I help you today?`;
    }
    
    // Default response - more natural and helpful
    const agentName = selectedAgent ? selectedAgent.name : config.agent.name;
    
    // Try to be more helpful based on context
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return `That's a great question! I'm ${agentName} and I specialize in Web3 operations, file management, and API calls. Could you be more specific about what you'd like to know or do? For example, you could ask me to check a balance, make a transfer, or read a file.`;
    }
    
    // For other casual conversation
    return `I'm ${agentName}, your Web3 AI assistant! I can help with blockchain operations, file management, and API calls. What would you like to work on today?`;
  }
}

async function testAgentResponses() {
  console.log('🤖 Testing Agent Responses (After Improvements)\n');
  
  const testAgent = new TestAgentService();
  const mockSelectedAgent = {
    name: 'TestAgent',
    avatar: '🚀'
  };
  
  const testQuestions = [
    "hey",
    "hello",
    "what's up?",
    "how old are you?",
    "how are you?",
    "what can you do?",
    "random question"
  ];
  
  console.log('📝 Testing improved responses:\n');
  
  for (const question of testQuestions) {
    console.log(`❓ User: "${question}"`);
    const response = testAgent.generateSimulatedResponse(question, mockSelectedAgent);
    console.log(`🤖 Agent: ${response}\n`);
    console.log('---\n');
  }
  
  console.log('✅ Test completed! Compare these responses with the old repetitive ones.');
  console.log('📋 Next steps:');
  console.log('1. Configure OpenAI API key (see SETUP_OPENAI.md)');
  console.log('2. Restart your app');
  console.log('3. Test with real conversations');
}

// Execute test
testAgentResponses().catch(console.error); 