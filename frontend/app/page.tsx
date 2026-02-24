'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, keccak256, toBytes } from 'viem';
import { INFERENCE_REGISTRY_ABI, CONTRACT_ADDRESS, WORKER_URL } from './lib/constants';
import { ConnectButton } from './components/ConnectButton';
import { Shield, Zap, Database, CheckCircle, Loader2, ArrowRight, ExternalLink, Globe, History, User, Lock } from 'lucide-react';
import { useGlobalHistory } from './hooks/useGlobalHistory';
import { VerificationPanel } from './components/VerificationPanel';
import { AuditFeed } from './components/AuditFeed';
// EthCrypto is lazy-loaded in the handler to prevent SSR hangs

const MODELS = [
  { id: 'llama3-8b-8192', name: 'Llama 3 (8B)', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7b', provider: 'Groq' },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [status, setStatus] = useState<'idle' | 'registering' | 'submitting' | 'waiting' | 'done'>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [workerPublicKey, setWorkerPublicKey] = useState<string | null>(null);

  const { writeContract, data: hash, isSuccess: isTxSuccess } = useWriteContract();
  const { isSuccess: isTxReceiptSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: requestCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: INFERENCE_REGISTRY_ABI,
    functionName: 'totalRequests',
  });

  const { data: onChainResult } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: INFERENCE_REGISTRY_ABI,
    functionName: 'getResult',
    args: requestId ? [BigInt(requestId)] : undefined,
    query: {
      enabled: status === 'waiting',
      refetchInterval: 3000,
    }
  });

  useEffect(() => {
    if (onChainResult && status === 'waiting') {
      setStatus('done');
      setResult(onChainResult);
    }
  }, [onChainResult, status]);

  useEffect(() => {
    fetch(`${WORKER_URL}/health`)
      .then(res => res.json())
      .then(async data => {
        if (data.publicKey) {
          setWorkerPublicKey(data.publicKey);
          console.log('🔐 Worker Public Key loaded for ECIES');
        }
      })
      .catch(err => console.error('Failed to fetch worker public key:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Generate clicked. Prompt:', prompt, 'Connected:', isConnected);
    if (!prompt.trim() || !isConnected) return;

    try {
      console.log('📝 Starting registration...');
      setStatus('registering');
      const promptHash = keccak256(toBytes(prompt));
      const nextId = requestCount ? Number(requestCount) : 0;
      console.log('🆔 Request ID:', nextId, 'Hash:', promptHash);

      let payload: any = prompt;
      if (workerPublicKey) {
        console.log('🔐 Encrypting prompt for 0G worker...');
        const EthCrypto = await import('eth-crypto');
        payload = await EthCrypto.encryptWithPublicKey(workerPublicKey, prompt);
        console.log('✅ Prompt encrypted successfully');
      } else {
        console.warn('⚠️  Worker public key not available, sending unencrypted');
      }

      console.log('📡 Registering prompt with worker...');
      const regResponse = await fetch(`${WORKER_URL}/register-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: nextId,
          prompt: payload,
          promptHash
        }),
      });

      if (!regResponse.ok) {
        const errorText = await regResponse.text();
        console.error('❌ Worker registration failed:', errorText);
        throw new Error(`Failed to register prompt with worker: ${errorText}`);
      }

      console.log('✅ Prompt registered with worker');
      console.log('📤 Submitting transaction to blockchain...');
      setStatus('submitting');
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: INFERENCE_REGISTRY_ABI,
        functionName: 'requestInference',
        args: [promptHash, selectedModel],
        value: parseEther('0.001'),
      });

      setRequestId(nextId.toString());
    } catch (err: any) {
      console.error('❌ Error:', err);
      alert(`Error: ${err.message || 'Unknown error occurred'}\n\nMake sure:\n1. You are connected to 0G Galileo Testnet\n2. You have at least 0.001 GO in your wallet\n3. The worker is running on localhost:3001`);
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (isTxReceiptSuccess) {
      setStatus('waiting');
    }
  }, [isTxReceiptSuccess]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
          <Shield size={14} /> Verifiable AI Inference
        </div>
        <h2 className="text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">
          The Trust Layer for <br /> Decentralized Intelligence
        </h2>
        <p className="max-w-2xl text-white/50 text-lg leading-relaxed">
          Submit prompts to powerful open-source models and receive cryptographically
          verifiable outputs stored permanently on 0G. No more black boxes—prove every inference.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12">
          {!mounted ? (
            <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center">
              <Loader2 className="mx-auto mb-4 text-white/20 animate-spin" size={48} />
              <h3 className="text-xl font-semibold mb-2">Initializing...</h3>
            </div>
          ) : !isConnected ? (
            <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center">
              <Zap className="mx-auto mb-4 text-white/20" size={48} />
              <h3 className="text-xl font-semibold mb-2">Connect to Get Started</h3>
              <p className="text-white/40 mb-8">You need to connect your wallet to the 0G Galileo Testnet to request inference.</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

              <form onSubmit={handleSubmit} className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white/70">Model Prompt</label>
                    <div className="flex gap-4">
                      {MODELS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedModel(m.id)}
                          className={`text-xs px-3 py-1 rounded-full transition-all ${selectedModel === m.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask anything..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium"
                  />
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Database size={12} /> Data permanently stored on 0G Storage
                  </div>
                </div>

                <div className="md:w-72 flex flex-col gap-4 justify-between">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/40">Inference Fee</span>
                      <span className="text-xs font-mono font-bold text-blue-400">0.001 GO</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Privacy</span>
                      <span className="text-xs font-mono font-bold text-blue-500 uppercase flex items-center gap-1">
                        <Lock size={10} /> ECIES
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={status !== 'idle' || !prompt.trim()}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${status === 'idle'
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                  >
                    {status === 'idle' ? (
                      <>Generate <ArrowRight size={18} /></>
                    ) : (
                      <><Loader2 className="animate-spin" size={18} /> {status.toUpperCase()}...</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {(status !== 'idle' || result) && (
          <div className="lg:col-span-12 mt-4 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {status === 'done' ? <CheckCircle size={20} /> : <Loader2 className="animate-spin" size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold">Request #{requestId}</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                      {status === 'done' ? 'Verified Output' : 'Processing Inference...'}
                    </p>
                  </div>
                </div>
                {status === 'done' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black italic rounded-lg tracking-tighter">
                    VERIFIED BY 0G
                  </div>
                )}
              </div>

              {status === 'done' ? (
                <div className="space-y-6">
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-white/80 leading-relaxed font-medium">
                    <p className="text-white/40 text-xs mb-2 uppercase tracking-widest font-bold">Self-Verify Trace</p>
                    <VerificationPanel rootHash={result.storagePointer} />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-widest">Commitment Hash</span>
                      <span className="text-xs font-mono text-blue-400">{result.resultHash.slice(0, 24)}...</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-widest">0G Root Hash (CID)</span>
                      <a
                        href={`https://storagescan-galileo.0g.ai/index.html?root=${result.storagePointer}`}
                        target="_blank"
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                      >
                        {result.storagePointer.slice(0, 24)}... <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-widest">Execution Node</span>
                      <span className="text-xs font-mono text-white/60">{result.node.slice(0, 16)}...</span>
                    </div>
                    <a
                      href={`https://chainscan-galileo.0g.ai/tx/${hash}`}
                      target="_blank"
                      className="ml-auto flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                    >
                      View on Explorer <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                  <div className="mt-8 flex justify-center">
                    <p className="text-sm text-white/20 animate-bounce">0G worker is computing proof...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AuditFeed />

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl">
          <h4 className="font-bold mb-4 flex items-center gap-2 italic text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> PROVABLE
          </h4>
          <p className="text-sm text-white/40 leading-relaxed">
            Every inference is tracked. The output you see is exactly what was produced, at a specific time, by a specific model. No tampering.
          </p>
        </div>
        <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl">
          <h4 className="font-bold mb-4 flex items-center gap-2 italic text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> PERMANENT
          </h4>
          <p className="text-sm text-white/40 leading-relaxed">
            Using 0G Zero Gravity storage layer, full inference traces (prompt + result) are available for audit at any time in the future.
          </p>
        </div>
        <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl">
          <h4 className="font-bold mb-4 flex items-center gap-2 italic text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> TRUSTLESS
          </h4>
          <p className="text-sm text-white/40 leading-relaxed">
            Move away from centralized black boxes like OpenAI. Trust the cryptography, verify the data availability, own the intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
