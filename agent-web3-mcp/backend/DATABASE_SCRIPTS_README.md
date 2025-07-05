# Database Inspection Scripts

This directory contains scripts to inspect and understand the database structure of your World Agent application.

## Scripts Overview

### 1. `inspect-database.js`
- **Purpose**: Connects to your MongoDB database and displays real records from each model
- **Use case**: When you have data in your database and want to see actual records
- **Features**:
  - Shows sample records from User, Agent, and SelfId models
  - Displays database statistics
  - Shows relationships between models
  - Provides verification counts

### 2. `generate-data-examples.js`
- **Purpose**: Generates example data structures for all models
- **Use case**: When you want to understand the data structure without connecting to the database
- **Features**:
  - Shows complete example structures for each model
  - Includes all possible fields and their data types
  - Provides field descriptions and summaries

## How to Use

### Prerequisites
- Node.js installed
- MongoDB running (for `inspect-database.js` only)
- Required dependencies installed: `npm install`

### Running the Scripts

#### 1. Inspect Live Database
```bash
# From the backend directory
cd agent-web3-mcp/backend
node inspect-database.js
```

**Environment Variables:**
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/world-agent-db`)

#### 2. Generate Example Structures
```bash
# From the backend directory
cd agent-web3-mcp/backend
node generate-data-examples.js
```

## Database Models

### User Model
- **Purpose**: Stores user information and verification data
- **Key Fields**:
  - `walletAddress`: Unique wallet address
  - `worldIdVerification`: Complete World ID verification proof
  - `selfIdVerification`: Complete Self Protocol verification proof
  - `linkedAgents`: Array of linked agent IDs
  - `stats`: Usage statistics

### Agent Model
- **Purpose**: Stores autonomous agent information
- **Key Fields**:
  - `name`: Agent name
  - `worldchain`: WorldChain wallet information (address, private key, mnemonic)
  - `owner`: Reference to owner User
  - `config`: Agent configuration and capabilities
  - `stats`: Usage statistics

### SelfId Model
- **Purpose**: Stores Self Protocol verification proofs
- **Key Fields**:
  - `uniqueHash`: Unique proof identifier
  - `proof`: Complete cryptographic proof
  - `isValidDetails`: Validation status
  - `discloseOutput`: Disclosed identity data
  - `expiresAt`: Proof expiration date

## Understanding the Output

### Sample Output Structure
```json
{
  "_id": "ObjectId",
  "walletAddress": "0x...",
  "worldIdVerification": {
    "isVerified": true,
    "fullProof": { ... },
    "verificationData": { ... }
  },
  "selfIdVerification": {
    "isVerified": true,
    "fullProof": { ... },
    "verificationResult": { ... }
  },
  "linkedAgents": ["ObjectId1", "ObjectId2"],
  "stats": { ... },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Verification Status
- **World ID Verification**: Proof of personhood using World ID
- **Self ID Verification**: Identity verification using Self Protocol
- **Agent Linking**: Relationship between users and their agents

## Common Use Cases

1. **Development**: Understanding data structure while building features
2. **Debugging**: Checking actual data when troubleshooting
3. **Documentation**: Generating examples for API documentation
4. **Testing**: Verifying data integrity and relationships

## Security Notes

- The `inspect-database.js` script will display sensitive information like private keys
- Only run these scripts in development environments
- Never commit database dumps or sensitive data to version control
- Consider using environment variables for production database URIs

## Troubleshooting

### Common Issues:
1. **Connection Error**: Check MongoDB is running and URI is correct
2. **No Data Found**: Scripts will show schema instead of actual records
3. **Permission Error**: Ensure proper database permissions

### Solutions:
- Verify MongoDB connection string
- Check database name and collection names
- Ensure models are properly defined and exported 