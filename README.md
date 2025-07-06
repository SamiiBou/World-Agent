# 🌍 Agent.ID

**Agent.ID** is a protocol for linking agents to verified human identities, powered by **World Chain**, **World ID**, **Self ID**, and **The Graph**. It is deployed as a **World App Mini** with three core features:

* ✅ Human ↔ Agent identity linking with verifiable credentials (VCs)
* 🧠 Agent creation & delegation (e.g. Gmail setup, DAO governance)
* 🕸️ Hypergraph-based knowledge spaces (agent profile graphs)

---

## 🗂️ Repository Overview

```
World-Agent/
├── agent-web3-mcp/      # Frontend + Backend API for agent management
│   ├── src/             # React app (World ID login, agent catalog, etc.)
│   └── backend/         # Express + MongoDB microservices
├── smart-contracts/     # Hardhat project: AgentRegistry, AgentDAO
├── The-graph/           # Subgraph for indexing contract events
└── self-protocol/       # Self ID tools & experimental utils
```

---

## ⚡ Quick Start

### Prerequisites

* Node.js ≥ 18
* npm / pnpm / yarn
* Local MongoDB instance (`mongodb://localhost:27017/world-agent`)
* World Chain RPC endpoint (or a local Hardhat node)

### 1. Clone & Install

```bash
git clone https://github.com/your-name/World-Agent.git
cd World-Agent
npm install
```

### 2. Set Up Environment Variables

Copy example files and edit them with your config:

```bash
cp agent-web3-mcp/backend/.env.example agent-web3-mcp/backend/.env
cp smart-contracts/.env.example         smart-contracts/.env
# Edit: RPC_URL, PRIVATE_KEY, MONGO_URL, etc.
```

---

### 3. Run the Stack

#### Terminal A – Frontend + Backend

```bash
# React App (http://localhost:3000)
cd agent-web3-mcp && npm install && npm start

# In a second terminal:
cd agent-web3-mcp/backend && npm install && npm start  # API on port 4000
```

#### Terminal B – Smart Contracts (optional)

```bash
cd smart-contracts && npm install
npx hardhat node                        # Launch local Hardhat chain on :8545
npx hardhat deploy --network localhost # Deploy contracts
```

#### Terminal C – The Graph (optional)

```bash
cd The-graph && npm install && npm run dev
```

---

## 🛠️ Common Scripts

| Directory                | Script           | Description                        |
| ------------------------ | ---------------- | ---------------------------------- |
| `agent-web3-mcp/`        | `npm start`      | Starts the React dev server        |
| `agent-web3-mcp/backend` | `npm start`      | Launches the Express API + MongoDB |
| `smart-contracts/`       | `npm test`       | Runs Hardhat contract tests        |
| `smart-contracts/`       | `npm run deploy` | Deploys contracts to a network     |
| `The-graph/`             | `npm run build`  | Builds the Graph protocol schema   |

---

## 🌱 Key Features

* ✅ Identity verification via **World ID** and **Self ID**
* 🧑‍🚀 Agent creation and on-chain registration
* 🪪 Issuance of **Verifiable Credentials** (VCs)
* 🧾 Delegated AI for Gmail setup, DAO voting, etc.
* 🔎 Agent profiles data indexing via **The Graph** & **Hypergraph Spaces**

---

## 🧑‍💻 Contributing

We welcome contributions!

1. Fork and create a new branch:
   `git checkout -b feat/my-feature`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Run local tests and linter
4. Submit a Pull Request – CI must pass for review

---

## 📄 License

[MIT](./LICENSE)

---

Let me know if you’d like a short project description for the GitHub sidebar, badge additions (build passing, license, etc.), or integration with Vercel, Railway, or other deploy targets.
