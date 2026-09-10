import "dotenv/config";
import { ethers } from "ethers";
import Groq from "groq-sdk";
import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import EthCrypto from "eth-crypto";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const {
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  RPC_URL = "https://evmrpc-testnet.0g.ai",
  GROQ_API_KEY,
  GROQ_MODEL = "llama3-8b-8192",
  POLL_INTERVAL_MS = "5000",
  INDEXER_URL = "https://indexer-storage-testnet.0g.ai",
  FLOW_CONTRACT_ADDRESS = "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296",
} = process.env;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !GROQ_API_KEY) {
  console.error("❌  Missing required env vars: PRIVATE_KEY, CONTRACT_ADDRESS, GROQ_API_KEY");
  process.exit(1);
}

// Minimal ABI — only what the worker needs
const ABI = [
  // Events
  "event InferenceRequested(uint256 indexed requestId, address indexed requester, bytes32 promptHash, string modelId, uint256 timestamp)",
  "event InferenceResultSubmitted(uint256 indexed requestId, bytes32 resultHash, string storagePointer, address indexed node, uint256 timestamp)",
  // Functions
  "function submitResult(uint256 requestId, bytes32 resultHash, string calldata storagePointer) external",
  "function getRequest(uint256 requestId) external view returns (tuple(address requester, bytes32 promptHash, string modelId, uint256 timestamp, bool fulfilled))",
  "function getResult(uint256 requestId) external view returns (tuple(bytes32 resultHash, string storagePointer, address node, uint256 timestamp))",
  "function totalRequests() external view returns (uint256)",
];

// ─────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
const groq = new Groq({ apiKey: GROQ_API_KEY });
const indexer = new Indexer(INDEXER_URL);

// Track requests already processed to avoid double-handling
const processed = new Set();

// ─────────────────────────────────────────────────────────────
// Core: Run Inference
// ─────────────────────────────────────────────────────────────

/**
 * Given a raw prompt string:
 * 1. Calls Groq API to get LLM output
 * 2. Hashes the output with keccak256
 * 3. Submits the hash + storage pointer to InferenceRegistry
 */
async function processInference(requestId, promptHash, modelId, rawPrompt) {
  const id = requestId.toString();
  if (processed.has(id)) return;
  processed.add(id);


  // ── Step 0: Decrypt if needed ──────────────────────────────
  let promptText = rawPrompt;
  if (typeof rawPrompt === 'object' && rawPrompt.iv) {
    try {
      promptText = await EthCrypto.decryptWithPrivateKey(PRIVATE_KEY, rawPrompt);
    } catch (err) {
      console.error(`    ❌ Decryption failed:`, err.message);
      processed.delete(id);
      return;
    }
  }


  // ── Step 1: Run inference via Groq ──────────────────────────
  let output;
  try {
    const model = modelId && modelId.trim() !== "" ? modelId : GROQ_MODEL;
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful and concise AI assistant. " +
            "Every response you give will be cryptographically committed on-chain for permanent auditability. " +
            "Be accurate and precise.",
        },
        { role: "user", content: promptText },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    output = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error(`    ❌ Groq API error:`, err.message);
    processed.delete(id); // allow retry
    return;
  }

  // ── Step 2: Hash the output ─────────────────────────────────
  const resultHash = ethers.keccak256(ethers.toUtf8Bytes(output));

  // ── Step 3: Package & Upload to 0G Storage ─────────────────
  const inferencePackage = JSON.stringify({
    requestId: id,
    promptHash,
    prompt: promptText,
    model: modelId || GROQ_MODEL,
    output,
    resultHash,
    timestamp: Date.now(),
    node: signer.address,
  });

  let storagePointer;
  try {

    // Create ZgFile from the package content
    const file = await ZgFile.fromBuffer(Buffer.from(inferencePackage));
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree.rootHash();

    // Check if file already exists in 0G
    const fileInfo = await indexer.getFileInfo(rootHash);
    if (fileInfo) {
    } else {
      // Upload file to 0G
      const [txHash, uploadErr] = await indexer.upload(file, 0, signer, FLOW_CONTRACT_ADDRESS);
      if (uploadErr) throw new Error(`0G upload error: ${uploadErr}`);
    }

    storagePointer = rootHash;
  } catch (err) {
    console.error(`    ❌ 0G Storage Error:`, err.message);
    storagePointer = `FALLBACK:${resultHash.slice(0, 32)}`;
  }

  // ── Step 4: Submit result hash to contract ──────────────────
  try {
    const tx = await contract.submitResult(requestId, resultHash, storagePointer);
    const receipt = await tx.wait();
  } catch (err) {
    console.error(`    ❌ Contract submission error:`, err.message);
    processed.delete(id); // allow retry
  }
}

// ─────────────────────────────────────────────────────────────
// Event Listener + Prompt Recovery
// ─────────────────────────────────────────────────────────────

/**
 * The raw prompt is not stored on-chain (only the hash is).
 * The frontend sends the prompt through two channels for the worker to recover:
 *   1. As an extra field in the event (when submitted via frontend's encodeFunctionData)
 *   2. Reconstructed from the user-supplied calldata via the InferenceRequested event tx data
 *
 * For MVP simplicity: the frontend stores the prompt in localStorage keyed by requestId,
 * AND the prompt is included in the event's transaction input data which we decode here.
 */
async function recoverPromptFromTx(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) return null;
    // ABI decode the requestInference(bytes32, string) calldata
    const iface = new ethers.Interface([
      "function requestInference(bytes32 promptHash, string modelId) payable returns (uint256)",
    ]);
    // We can't recover the original prompt from the hash alone —
    // for MVP, the frontend emits the prompt via a separate call or we use a prompt registry
    // Return null to use fallback prompt
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Polling Fallback (catches missed events on reconnects)
// ─────────────────────────────────────────────────────────────

// In-memory prompt registry: requestId → rawPrompt
// The frontend calls a worker HTTP endpoint to register the prompt before submitting to chain
const promptRegistry = new Map();

/**
 * Expose a simple HTTP server so the frontend can POST the raw prompt
 * before submitting the on-chain transaction.
 * Worker receives: { requestId, prompt, promptHash }
 *
 * This is the MVP bridge for prompt delivery.
 * In production: use encrypted storage or commit–reveal.
 */
import { createServer } from "http";

const HTTP_PORT = process.env.WORKER_PORT || 3001;

const httpServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/register-prompt") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { requestId, prompt, promptHash } = JSON.parse(body);
        if (requestId !== undefined && prompt) {
          promptRegistry.set(requestId.toString(), { prompt, promptHash });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing requestId or prompt" }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    const publicKey = EthCrypto.publicKeyByPrivateKey(PRIVATE_KEY);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      node: signer.address,
      publicKey: publicKey
    }));
    return;
  }

  res.writeHead(404);
  res.end();
});

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────

async function start() {

  // Verify node is authorized
  try {
    const totalRequests = await contract.totalRequests();
  } catch (e) {
  }

  // Start HTTP prompt-registration server
  httpServer.listen(HTTP_PORT, () => {
  });

  // Listen for InferenceRequested events

  contract.on("InferenceRequested", async (requestId, requester, promptHash, modelId, timestamp, event) => {
    const id = requestId.toString();

    // Recover prompt from registry (posted by frontend before tx)
    const registered = promptRegistry.get(id);
    const rawPrompt = registered?.prompt ?? `[Prompt for requestId ${id} — register via POST /register-prompt]`;

    await processInference(requestId, promptHash, modelId, rawPrompt);
  });

  // Polling fallback: scan for unfulfilled requests periodically
  setInterval(async () => {
    try {
      const total = Number(await contract.totalRequests());
      for (let id = 0; id < total; id++) {
        if (processed.has(id.toString())) continue;
        const req = await contract.getRequest(id);
        if (!req.fulfilled) {
          const registered = promptRegistry.get(id.toString());
          const rawPrompt = registered?.prompt ?? `[Prompt for requestId ${id}]`;
          await processInference(BigInt(id), req.promptHash, req.modelId, rawPrompt);
        }
      }
    } catch (e) {
      // Suppress routine poll errors
    }
  }, parseInt(POLL_INTERVAL_MS));
}

start().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
