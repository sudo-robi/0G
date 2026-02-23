# Verifiable AI Inference Marketplace
### — The trust layer for decentralized intelligence —

**Built on 0G Zero Gravity.**

> "We are building verifiable AI infrastructure, the missing trust layer between AI and blockchain. Without verifiable data availability, AI cannot be trustless. That’s why we built this on 0G."

---

## Architecture
The system consists of four layers:

1.  **Application Layer (Frontend)**: Next.js 14 (Security patched) with `wagmi`, `viem`, and **`eth-crypto`** for ECIES encryption.
2.  **Smart Contract Layer**: Deployed on 0G Galileo Testnet. Stores commitments and triggers workers.
3.  **Inference Layer (Worker)**: Off-chain Node.js worker using **Groq API** and the **0G TypeScript SDK**.
4.  **Storage Layer (0G)**: Permanent Data Availability for full inference traces via **Storage Indexer API**.

---

## High-Level Flow
1. **User submits prompt** via the Frontend.
2. **Frontend encrypts prompt** using the worker's public key (**ECIES**) and hashes it.
3. **Smart contract stores commitment** and emits an `InferenceRequested` event.
4. **Off-chain node detects event**, decrypts the prompt, and runs the selected model.
5. **Node generates output**, hashes it, and uploads the full package to **0G Storage**.
6. **Node submits Root Hash** back to the contract.
7. **Anyone can verify**: The frontend fetches data directly from the **0G Indexer API**, proves the Merkle Root, and compares the result hash with the on-chain commitment.

---

## Smart Contract & Network
**Network**: 0G Galileo Testnet  
**Chain ID**: 16602  
**Contract Address**: [`0x915cc86fe0871835e750e93e025080fff9927a3f`](https://chainscan-galileo.0g.ai/address/0x915cc86fe0871835e750e93e025080fff9927a3f)
**Worker Node**: `0xEB509499bC91EcdB05dE285FB1D880dceb82688E`
**0G Flow Contract**: `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296`

### Functions:
- `requestInference(bytes32 promptHash, string modelId)`
- `submitResult(uint256 requestId, bytes32 resultHash, string storagePointer)`
- `getRequest(uint256 id)`
- `getResult(uint256 id)`

---

## Setup & Run

### 1. Smart Contract (Foundry)
```bash
cd contracts
forge build
# Test
forge test -vv
# Deploy
# Add your environment variables to contracts/.env
source .env && forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

### 2. Off-chain Worker (Node.js)
```bash
cd worker
npm install
# Configure .env with Groq API Key and Worker Private Key
npm start
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## ⚡ Production Readiness
- **Security**: Next.js 14.2.22 (DoS protection).
- **Stability**: Pinned `ethers@6.13.1` and `eth-crypto@3.1.0` for 0G SDK compatibility.
- **Privacy**: End-to-end encryption via ECIES.
- **Performance**: Optimized for 0G Galileo Testnet with retry-resilient RPC connections.

---

## 🌟 Phase 3: Advanced Features
- **Global History Feed**: Live `getLogs` scanner showing every inference on the 0G network.
- **End-to-End Privacy**: User prompts are encrypted with the worker's public key.
- **Direct 0G Retrieval**: Frontend uses the 0G SDK to download and display traces without a middleman.
- **Dynamic Model Selection**: Supports multiple models (Llama 3, Mixtral) with logic-aware workers.

---

## 💡 Why This Matters
AI today is a centralized black box. For AI to integrate with Web3, finance, and compliance, it must become **verifiable**. We provide the cryptographic proof that:
- The prompt wasn't altered (ECIES + Hash).
- The output wasn't modified (Keccak256).
- The model version was consistent.
- The result is permanently available and auditable via 0G.
