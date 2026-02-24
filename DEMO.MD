Live Demo Flow for Judges
1. Show the Live Application
Open: https://0-g-teal.vercel.app/

Point out:

Clean UI showing "Verifiable AI Inference Marketplace"
Model selection (Llama 3, Mixtral)
Fee display: 0.001 GO
Privacy indicator: ECIES encryption

2. Execute a Live Inference
Step 1: Connect MetaMask

Click "Connect" button
Show 0G Galileo Testnet connection (Chain ID: 16602)
Step 2: Submit a prompt

Prompt example: "Explain blockchain in simple terms"

Type it in the textarea
Click "Generate"
Show MetaMask popup - transaction for 0.001 GO
Approve transaction

Step 3: Watch the process

Status changes: REGISTERING → SUBMITTING → WAITING
Point out: "Worker is computing proof..."
Takes 10-30 seconds
Step 4: Show the verified result

Status: DONE with green checkmark
"VERIFIED BY 0G" badge appears
AI response is displayed
Show the verification details:
Commitment Hash
0G Root Hash (CID)
Execution Node address
Link to transaction explorer

3. Prove Verification Works
Click "View on Explorer" to show:

Transaction on 0G Galileo blockchain
Smart contract interaction
On-chain hash commitment
Click 0G Storage link to show:

Full inference trace stored on 0G
Permanent, retrievable data

4. Show the Audit Feed
Scroll down to "Network Audit" section:

Live feed of all inferences on the network
Shows: Request ID, Model, Status, Timestamp
Proves transparency - anyone can see all AI usage

5. Open Browser Console (F12)
Show the logs proving cryptographic operations:

 Worker Public Key loaded for ECIES
 Starting registration...
 Request ID: X, Hash: 0x...
 Encrypting prompt for 0G worker...
 Prompt encrypted successfully
 Registering prompt with worker...
 Prompt registered with worker
 Submitting transaction to blockchain...


6. Check Worker Terminal
Show live worker logs:
 Event: InferenceRequested #X
    Requester: 0x...
    Tx Hash: 0x...
 Decrypting ECIES prompt...
 Decrypted successfully
 Calling Groq with model: llama3-8b-8192
 Uploading to 0G Storage...
 Uploaded. Root: 0x...
 Result submitted on-chain

Show the Smart Contract
Open: https://chainscan-galileo.0g.ai/address/0x915cc86fe0871835e750e93e025080fff9927a3f


Prove:

Contract is deployed and verified
Show recent transactions
Point to requestInference and submitResult calls

8. Key Points to Emphasize
"It's LIVE and WORKING" - not just a concept
End-to-end encryption - prompts are private
On-chain commitments - hashes prove integrity
0G Storage - permanent data availability
Fully verifiable - anyone can audit
Real AI models - actual Llama 3/Mixtral responses

9. Run the Test Script
Show system health:
./test-setup.sh

Output proves:

✅ Worker running
✅ Frontend running
✅ Contract deployed
✅ All systems operational

