const mongoose = require('mongoose');
const User = require('./models/User');
const Agent = require('./models/Agent');
const SelfId = require('./models/SelfId');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';

async function inspectDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n' + '='.repeat(80));
    console.log('🔍 DATABASE INSPECTION - MODEL STRUCTURES');
    console.log('='.repeat(80));

    // 1. User model inspection
    console.log('\n📋 USER MODEL:');
    console.log('-'.repeat(50));
    
    const userCount = await User.countDocuments();
    console.log(`Total users: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne().populate('linkedAgents');
      console.log('\n📄 SAMPLE USER RECORD:');
      console.log(JSON.stringify(sampleUser.toObject(), null, 2));
    } else {
      console.log('❌ No users found');
      console.log('\n📄 USER MODEL STRUCTURE (schema):');
      console.log(JSON.stringify(User.schema.obj, null, 2));
    }

    // 2. Agent model inspection
    console.log('\n\n📋 AGENT MODEL:');
    console.log('-'.repeat(50));
    
    const agentCount = await Agent.countDocuments();
    console.log(`Total agents: ${agentCount}`);
    
    if (agentCount > 0) {
      const sampleAgent = await Agent.findOne().populate('owner');
      console.log('\n📄 SAMPLE AGENT RECORD:');
      console.log(JSON.stringify(sampleAgent.toObject(), null, 2));
    } else {
      console.log('❌ No agents found');
      console.log('\n📄 AGENT MODEL STRUCTURE (schema):');
      console.log(JSON.stringify(Agent.schema.obj, null, 2));
    }

    // 3. SelfId model inspection
    console.log('\n\n📋 SELFID MODEL:');
    console.log('-'.repeat(50));
    
    const selfIdCount = await SelfId.countDocuments();
    console.log(`Total SelfId records: ${selfIdCount}`);
    
    if (selfIdCount > 0) {
      const sampleSelfId = await SelfId.findOne();
      console.log('\n📄 SAMPLE SELFID RECORD:');
      console.log(JSON.stringify(sampleSelfId.toObject(), null, 2));
    } else {
      console.log('❌ No SelfId records found');
      console.log('\n📄 SELFID MODEL STRUCTURE (schema):');
      console.log(JSON.stringify(SelfId.schema.obj, null, 2));
    }

    // 4. General statistics
    console.log('\n\n📊 DATABASE STATISTICS:');
    console.log('-'.repeat(50));
    console.log(`👥 Users: ${userCount}`);
    console.log(`🤖 Agents: ${agentCount}`);
    console.log(`🔐 SelfId: ${selfIdCount}`);

    // 5. Model relationships
    if (userCount > 0 && agentCount > 0) {
      console.log('\n🔗 MODEL RELATIONSHIPS:');
      console.log('-'.repeat(50));
      
      // Users with agents
      const usersWithAgents = await User.find({ linkedAgents: { $ne: [] } }).populate('linkedAgents');
      console.log(`👥 Users with agents: ${usersWithAgents.length}`);
      
      if (usersWithAgents.length > 0) {
        console.log('\n📋 SAMPLE USER-AGENT RELATIONSHIP:');
        const userWithAgent = usersWithAgents[0];
        console.log(`User: ${userWithAgent.walletAddress}`);
        console.log(`Linked agents: ${userWithAgent.linkedAgents.length}`);
        userWithAgent.linkedAgents.forEach((agent, index) => {
          console.log(`  Agent ${index + 1}: ${agent.name} (${agent.worldchain.address})`);
        });
      }
    }

    // 6. Verifications
    console.log('\n✅ VERIFICATIONS:');
    console.log('-'.repeat(50));
    
    const verifiedWorldIdUsers = await User.countDocuments({ 'worldIdVerification.isVerified': true });
    const verifiedSelfIdUsers = await User.countDocuments({ 'selfIdVerification.isVerified': true });
    const activeAgents = await Agent.countDocuments({ 'config.isActive': true });
    
    console.log(`🌍 World ID verified users: ${verifiedWorldIdUsers}`);
    console.log(`🔐 Self ID verified users: ${verifiedSelfIdUsers}`);
    console.log(`🤖 Active agents: ${activeAgents}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ INSPECTION COMPLETED');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during inspection:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute inspection
if (require.main === module) {
  inspectDatabase();
}

module.exports = { inspectDatabase }; 