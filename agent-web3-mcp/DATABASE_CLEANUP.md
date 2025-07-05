# 🧹 Database Cleanup Script

This script allows you to completely clear your local MongoDB database during development and testing.

## 🚀 Usage

### Option 1: Using npm scripts (Recommended)
```bash
# Navigate to backend directory
cd backend

# Clear all collections
npm run clear-db

# Clear all collections + rebuild indexes
npm run reset-db
```

### Option 2: Direct execution
```bash
# From backend directory
cd backend
node clear-database.js          # Clear all collections
node clear-database.js reset    # Clear all collections + rebuild indexes
```

## 📊 What Gets Cleared

The script will clear these collections:
- **Users** - All user accounts, wallet addresses, World ID verifications, Self Protocol data
- **Agents** - All AI agents, World Chain addresses, and ownership links
- **SelfId** - All Self Protocol verification records

## 🔧 Features

- **Safe execution** - Shows current database state before clearing
- **Verification** - Confirms all data was successfully cleared
- **Index rebuilding** - The `reset` command rebuilds database indexes
- **Graceful shutdown** - Properly closes database connections
- **Error handling** - Comprehensive error reporting

## ⚠️ Important Notes

1. **This permanently deletes ALL data** in your local database
2. **Only affects local development** - production databases are not touched
3. **Requires MongoDB connection** - Make sure your local MongoDB is running
4. **Uses environment variables** - Reads `MONGODB_URI` from your `.env` file or defaults to `mongodb://localhost:27017/agent-web3`

## 🛡️ Safety Features

- Interactive confirmation before clearing data
- Detailed logging of operations
- Verification of successful deletion
- Graceful handling of interruptions (Ctrl+C)

## 🔄 When to Use

Use this script when you need to:
- Start fresh during development
- Clear test data
- Reset the database after schema changes
- Clean up before important testing

## 📝 Example Output

```
✅ MongoDB connected successfully
🧹 Starting database cleanup...

📊 Current database state:
👥 Users: 5
🤖 Agents: 12
🆔 SelfId records: 3

🗑️ Clearing collections...
✅ Cleared 5 users
✅ Cleared 12 agents
✅ Cleared 3 SelfId records

📊 Final database state:
👥 Users remaining: 0
🤖 Agents remaining: 0
🆔 SelfId records remaining: 0

🎉 Database successfully cleared!
🔌 Database connection closed
```

## 🔧 Environment Setup

Make sure you have a `.env` file in your backend directory with:
```
MONGODB_URI=mongodb://localhost:27017/agent-web3
```

Or the script will use the default local MongoDB connection. 