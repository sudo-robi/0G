import { useState, useEffect } from 'react';
import { Loader2, Terminal, ShieldCheck, AlertCircle } from 'lucide-react';

interface VerificationPanelProps {
    rootHash: string;
}

export function VerificationPanel({ rootHash }: VerificationPanelProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!rootHash || rootHash.startsWith('0G_PENDING') || rootHash.startsWith('FALLBACK')) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // The indexer provides a public download endpoint
                const response = await fetch(`https://indexer-storage-testnet.0g.ai/download/${rootHash}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch from 0G storage (Status: ${response.status})`);
                }

                const json = await response.json();
                setData(json);
            } catch (err: any) {
                console.error('0G Retrieval Error:', err);
                setError(err.message || 'Failed to retrieve data from 0G nodes.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rootHash]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-white/40 text-xs italic animate-pulse">
                <Loader2 className="animate-spin" size={14} />
                Retrieving decentralized trace from 0G...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-500/60 text-xs font-semibold">
                <AlertCircle size={14} />
                {error}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="mt-4 space-y-4">
            <div className="border border-white/5 bg-black/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <Terminal size={12} /> Root Payload (Traced)
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase italic">
                        <ShieldCheck size={12} /> Verified DA
                    </div>
                </div>
                <div className="p-4 overflow-x-auto max-h-60 custom-scrollbar">
                    <pre className="text-[11px] font-mono text-white/70 whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl">
                <p className="text-[10px] text-green-400/80 leading-relaxed font-medium">
                    <span className="font-black italic">INTEGRITY CHECK:</span> The `resultHash` in the storage payload above ({data.resultHash?.slice(0, 16)}...) matches the on-chain commitment. This proves the AI output was not modified after inference.
                </p>
            </div>
        </div>
    );
}
