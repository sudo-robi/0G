'use client';

import { useGlobalHistory } from '../hooks/useGlobalHistory';
import { Globe, History, User, ExternalLink, Loader2 } from 'lucide-react';

export function AuditFeed() {
    const { history: globalHistory, loading: isHistoryLoading } = useGlobalHistory();

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-white">Network Audit</h3>
                        <p className="text-sm text-white/40 uppercase tracking-widest font-bold">Live Global Inference Feed</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Monitoring
                </div>
            </div>

            <div className="space-y-4">
                {isHistoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl">
                        <Loader2 className="animate-spin text-white/20 mb-4" size={32} />
                        <p className="text-white/30 text-sm">Scanning blockchain logs...</p>
                    </div>
                ) : globalHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl text-center">
                        <History className="text-white/10 mb-4" size={48} />
                        <h4 className="text-white/60 font-semibold">No Inferences Found</h4>
                        <p className="text-white/30 text-sm max-w-sm mt-2">
                            Be the first to request a verifiable AI inference on the 0G Galileo Network.
                        </p>
                    </div>
                ) : (
                    globalHistory.map((item) => (
                        <div key={item.requestId.toString()} className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all backdrop-blur-sm flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-4 min-w-[140px]">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                                    <span className="font-mono text-sm">#{item.requestId.toString()}</span>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white/20 uppercase tracking-widest">Model</div>
                                    <div className="text-sm font-semibold text-white/70">{item.modelId}</div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1">Requester</div>
                                <div className="flex items-center gap-2">
                                    <User size={12} className="text-white/20" />
                                    <span className="text-xs font-mono text-white/40">{item.requester.slice(0, 8)}...{item.requester.slice(-6)}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1">On-chain Hash</div>
                                <span className="text-xs font-mono text-blue-400/60">{item.promptHash.slice(0, 16)}...</span>
                            </div>

                            <div className="flex items-center gap-6">
                                {item.fulfilled ? (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black italic rounded border border-green-500/20 mb-2">
                                            VERIFIED ✓
                                        </div>
                                        <a
                                            href={`https://storagescan-galileo.0g.ai/index.html?root=${item.storagePointer}`}
                                            target="_blank"
                                            className="text-[10px] text-white/30 hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            0G Storage <ExternalLink size={10} />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-black italic rounded border border-yellow-500/20">
                                        PENDING...
                                    </div>
                                )}
                                <div className="text-right min-w-[100px]">
                                    <div className="text-[10px] text-white/20 uppercase font-bold">Time</div>
                                    <div className="text-xs text-white/40">{new Date(Number(item.timestamp) * 1000).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
