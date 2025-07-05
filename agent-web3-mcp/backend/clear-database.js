const mongoose = require('mongoose');
require('dotenv').config();

// Import models with correct paths
const User = require('./models/User');
const Agent = require('./models/Agent');
const SelfId = require('./models/SelfId');

// Database connection function
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to clear all collections
const clearDatabase = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Get collection stats before clearing
    const userCount = await User.countDocuments();
    const agentCount = await Agent.countDocuments();
    const selfIdCount = await SelfId.countDocuments();
    
    console.log('\n📊 Current database state:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🤖 Agents: ${agentCount}`);
    console.log(`🆔 SelfId records: ${selfIdCount}`);
    
    if (userCount === 0 && agentCount === 0 && selfIdCount === 0) {
      console.log('\n✅ Database is already empty!');
      return;
    }
    
    console.log('\n🗑️ Clearing collections...');
    
    // Clear all collections
    const userResult = await User.deleteMany({});
    console.log(`✅ Cleared ${userResult.deletedCount} users`);
    
    const agentResult = await Agent.deleteMany({});
    console.log(`✅ Cleared ${agentResult.deletedCount} agents`);
    
    const selfIdResult = await SelfId.deleteMany({});
    console.log(`✅ Cleared ${selfIdResult.deletedCount} SelfId records`);
    
    // Verify all collections are empty
    const remainingUsers = await User.countDocuments();
    const remainingAgents = await Agent.countDocuments();
    const remainingSelfIds = await SelfId.countDocuments();
    
    console.log('\n📊 Final database state:');
    console.log(`👥 Users remaining: ${remainingUsers}`);
    console.log(`🤖 Agents remaining: ${remainingAgents}`);
    console.log(`🆔 SelfId records remaining: ${remainingSelfIds}`);
    
    if (remainingUsers === 0 && remainingAgents === 0 && remainingSelfIds === 0) {
      console.log('\n🎉 Database successfully cleared!');
    } else {
      console.log('\n⚠️ Some records may still remain. Please check manually.');
    }
    
  } catch (error) {
    console.error('💥 Error clearing database:', error);
    throw error;
  }
};

// Function to reset database with indexes
const resetDatabase = async () => {
  try {
    await clearDatabase();
    
    console.log('\n🔧 Rebuilding indexes...');
    
    // Recreate indexes by ensuring they exist
    await User.createIndexes();
    await Agent.createIndexes();
    await SelfId.createIndexes();
    
    console.log('✅ Indexes rebuilt successfully');
    
  } catch (error) {
    console.error('💥 Error resetting database:', error);
    throw error;
  }
};

// Main execution function
const main = async () => {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    await connectDB();
    
    if (command === 'reset') {
      console.log('🔄 Resetting database (clear + rebuild indexes)...');
      await resetDatabase();
    } else {
      console.log('🧹 Clearing database...');
      await clearDatabase();
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Script interrupted by user');
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error closing connection:', error);
  }
  process.exit(0);
});

// Show usage if no valid command
if (process.argv.length < 2) {
  console.log(`
🧹 Database Cleanup Script

Usage:
  node clear-database.js          # Clear all collections
  node clear-database.js reset    # Clear all collections + rebuild indexes

Collections that will be cleared:
  • Users (wallet addresses, verifications, linked agents)
  • Agents (AI agents, World Chain addresses, owners)
  • SelfId (Self Protocol verification records)

⚠️  WARNING: This will permanently delete ALL data in your local database!
`);
  process.exit(0);
}

// Run the script
main(); 