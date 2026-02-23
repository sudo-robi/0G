'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { truncateAddress } from '../lib/utils';

export function ConnectButton() {
    const [mounted, setMounted] = useState(false);
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (isConnected) {
        return (
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium">
                    {truncateAddress(address!)}
                </div>
                <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => connect({ connector: injected() })}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
            Connect Wallet
        </button>
    );
}
