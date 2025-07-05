const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';

async function checkUsernameField() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING USERNAME FIELD');
    console.log('='.repeat(80));

    // 1. Check if username field exists in schema
    console.log('\n📋 USER MODEL SCHEMA:');
    console.log('-'.repeat(50));
    
    const userSchema = User.schema;
    const usernameField = userSchema.paths.username;
    
    if (usernameField) {
      console.log('✅ Username field found in schema!');
      console.log(`   - Type: ${usernameField.instance}`);
      console.log(`   - Required: ${usernameField.isRequired}`);
      console.log(`   - Options:`, usernameField.options);
    } else {
      console.log('❌ Username field NOT found in schema');
    }

    // 2. Check all schema fields
    console.log('\n📋 ALL SCHEMA FIELDS:');
    console.log('-'.repeat(50));
    Object.keys(userSchema.paths).forEach(fieldName => {
      const field = userSchema.paths[fieldName];
      console.log(`   - ${fieldName}: ${field.instance}`);
    });

    // 3. Check users in database
    console.log('\n📋 USERS IN DATABASE:');
    console.log('-'.repeat(50));
    
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    
    if (users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`\n👤 User ${i + 1}:`);
        console.log(`   - Wallet Address: ${user.walletAddress}`);
        console.log(`   - Username field exists: ${user.username !== undefined}`);
        console.log(`   - Username value: ${user.username || 'null/undefined'}`);
        console.log(`   - Raw username property: ${JSON.stringify(user.username)}`);
        
        // Check if username property exists on the object
        console.log(`   - Has username property: ${user.hasOwnProperty('username')}`);
        console.log(`   - Username in toObject: ${user.toObject().hasOwnProperty('username')}`);
        
        // Show all keys of the user object
        console.log(`   - User object keys:`, Object.keys(user.toObject()));
      }
    }

    // 4. Test creating a new user with username
    console.log('\n📋 TESTING USERNAME CREATION:');
    console.log('-'.repeat(50));
    
    try {
      const testUser = new User({
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testuser'
      });
      
      console.log('✅ Test user created successfully with username');
      console.log(`   - Username: ${testUser.username}`);
      console.log(`   - Username in toObject: ${testUser.toObject().username}`);
      
      // Don't save the test user to avoid conflicts
    } catch (error) {
      console.log('❌ Error creating test user:', error.message);
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute check
if (require.main === module) {
  checkUsernameField();
}

module.exports = { checkUsernameField }; 