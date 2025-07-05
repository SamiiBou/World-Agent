const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';

async function migrateAddUsername() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n' + '='.repeat(80));
    console.log('🔄 MIGRATION: Adding username field to existing users');
    console.log('='.repeat(80));

    // Find all users without username field
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null }
      ]
    });

    console.log(`📊 Found ${usersWithoutUsername.length} users without username field`);

    if (usersWithoutUsername.length === 0) {
      console.log('✅ All users already have username field');
      return;
    }

    // Update each user to add username field
    let updatedCount = 0;
    
    for (const user of usersWithoutUsername) {
      console.log(`\n🔄 Updating user: ${user.walletAddress}`);
      
      // Set username to null initially (will be filled when user reconnects)
      user.username = null;
      
      try {
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user: ${user.walletAddress}`);
      } catch (error) {
        console.error(`❌ Error updating user ${user.walletAddress}:`, error.message);
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`   - Users processed: ${usersWithoutUsername.length}`);
    console.log(`   - Users updated: ${updatedCount}`);
    console.log(`   - Users failed: ${usersWithoutUsername.length - updatedCount}`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const allUsers = await User.find({});
    const usersWithUsername = await User.find({ username: { $exists: true } });
    
    console.log(`   - Total users: ${allUsers.length}`);
    console.log(`   - Users with username field: ${usersWithUsername.length}`);
    
    if (allUsers.length === usersWithUsername.length) {
      console.log('✅ Migration verified successfully!');
    } else {
      console.log('❌ Migration incomplete - some users still missing username field');
    }

    console.log('\n💡 Note: Username values will be populated when users reconnect with their wallet.');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute migration
if (require.main === module) {
  migrateAddUsername();
}

module.exports = { migrateAddUsername }; 