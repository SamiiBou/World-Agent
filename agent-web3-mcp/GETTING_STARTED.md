# Getting Started with Agent Web3 MCP

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)
- An Alchemy API key for World Chain

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd agent-web3-mcp
```

#### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

#### 3. Configuration
Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/agent-web3
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
ALCHEMY_API_KEY=vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
NODE_ENV=development
PORT=3001
```

#### 4. Start the services
```bash
# Start MongoDB (if local)
mongod

# Start backend (in backend directory)
npm start

# Start frontend (in main directory)
npm start
```

## 🎯 First Steps

### 1. Check the connection
- Open your browser to `https://77789bb5180a.ngrok.app`
- You should see the connection status in the top right
- If the backend is not connected, check that MongoDB and the backend are running

### 2. Create your first agent
1. **Click on "🤖 Agent Manager"**
2. **Fill in the form:**
   - Name: "My Test Agent"
   - Description: "First World Chain agent"
   - Choose an avatar

3. **Click "🚀 Create Agent"**

**Result:** The agent will be created with:
- ✅ A unique World Chain address
- ✅ MongoDB storage
- ✅ Ready for conversations

### 3. Chat with your agent
1. **The agent will be automatically selected**
2. **Start a conversation:**
   - "What's my World Chain address?"
   - "What's my balance?"
   - "Transfer 0.1 ETH to 0x..."

## 📋 Available Features

### ✅ Complete Agent Management
- ✅ **Agent creation** with automatic World Chain addresses
- ✅ **Agent selection** for conversations
- ✅ **Information display** (address, balance, stats)
- ✅ **MongoDB storage** for persistence

### ✅ World Chain Integration
- ✅ **Address generation** automatic
- ✅ **Balance checking** real-time
- ✅ **Transfer simulation** secure
- ✅ **Explorer integration** for addresses

### ✅ Modern Interface
- ✅ **Responsive design** for all devices
- ✅ **Dark/Light** themes
- ✅ **Real-time updates** for balances
- ✅ **Visual feedback** for all actions

## 🔧 API Usage

### Create an agent
```bash
curl -X POST https://37b2a30b1f1c.ngrok.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agent Name",
    "description": "Description",
    "avatar": "🤖"
  }'
```

### List agents
```bash
curl https://37b2a30b1f1c.ngrok.app/api/agents
```

### Get agent balance
```bash
curl https://37b2a30b1f1c.ngrok.app/api/agents/{id}/balance
```

### Transfer simulation
```bash
curl -X POST https://37b2a30b1f1c.ngrok.app/api/agents/{id}/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x...",
    "amount": "0.1"
  }'
```

## 🛠️ Troubleshooting

### Backend not connected
1. Check that MongoDB is running
2. Check the browser console for errors
3. Verify the `.env` file configuration
4. Restart the backend

### Agent not created
1. Check the backend logs
2. Verify the database connection
3. Check the API request format

### Example successful response:
```json
{
  "message": "Agent created successfully",
  "agent": {
    "id": "...",
    "name": "Agent Name",
    "description": "Description",
    "avatar": "🤖",
    "address": "0x...",
    "balance": "0",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🌟 Next Steps

1. **Explore the interface** - test all features
2. **Create multiple agents** - each with its own address
3. **Check real balances** - connect to World Chain
4. **Develop integrations** - use the API for your own apps
5. **Send ETH** to an agent address to test real balances

## 📚 Additional Resources

- [World Chain Documentation](https://docs.worldchain.org/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://reactjs.org/)

## 🆘 Support

If you encounter issues:
1. Check the logs (backend and frontend)
2. Verify your configuration
3. Restart the services
4. Check the database connection

The application is now ready to use! 🎉 