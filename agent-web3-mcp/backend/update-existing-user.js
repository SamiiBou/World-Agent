const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';

async function updateExistingUser() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n' + '='.repeat(80));
    console.log('🔄 UPDATING EXISTING USER WITH USERNAME FIELD');
    console.log('='.repeat(80));

    // Find the user without username field
    const user = await User.findOne({ 
      walletAddress: '0x21bee69e692ceb4c02b66c7a45620684904ba395' 
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`📋 Found user: ${user.walletAddress}`);
    console.log(`📋 Current username: ${user.username || 'undefined'}`);

    // Update the user to include username field
    user.username = null; // Will be populated when user reconnects
    await user.save();

    console.log('✅ User updated successfully!');
    
    // Verify the update
    const updatedUser = await User.findOne({ 
      walletAddress: '0x21bee69e692ceb4c02b66c7a45620684904ba395' 
    });

    console.log('\n📋 VERIFICATION:');
    console.log(`   - Username field exists: ${updatedUser.username !== undefined}`);
    console.log(`   - Username value: ${updatedUser.username || 'null'}`);
    console.log(`   - Username in toObject: ${updatedUser.toObject().hasOwnProperty('username')}`);
    
    // Show the user's public info
    console.log('\n📋 USER PUBLIC INFO:');
    console.log(JSON.stringify(updatedUser.getPublicInfo(), null, 2));

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute update
if (require.main === module) {
  updateExistingUser();
}

module.exports = { updateExistingUser }; 