'use client';

import { AuditFeed } from '../components/AuditFeed';
import { History, Shield } from 'lucide-react';

export default function HistoryPage() {
    return (
        <div className="max-w-6xl mx-auto px-8 py-12">
            <div className="flex flex-col items-center text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                    <History size={14} /> Global History
                </div>
                <h2 className="text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">
                    Network Intelligence <br /> Audit Feed
                </h2>
                <p className="max-w-2xl text-white/50 text-lg leading-relaxed">
                    Browse every inference request and verification trace processed by the 0G network.
                    Real-time access to the immutable execution record.
                </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <AuditFeed />
            </div>

            <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
                <Shield className="text-blue-400 mt-1" size={24} />
                <div>
                    <h4 className="font-bold text-white mb-2">Immutable Verification</h4>
                    <p className="text-sm text-white/40 leading-relaxed">
                        This feed is generated directly from 0G Galileo Testnet logs. Each record contains a link to
                        the raw trace stored on 0G Storage, allowing anyone to independently verify the integrity
                        of the AI model's output.
                    </p>
                </div>
            </div>
        </div>
    );
}
