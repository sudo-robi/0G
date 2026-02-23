import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { INFERENCE_REGISTRY_ABI, CONTRACT_ADDRESS } from '../lib/constants';
import { parseAbiItem } from 'viem';

export interface GlobalInference {
    requestId: bigint;
    requester: string;
    promptHash: string;
    modelId: string;
    timestamp: bigint;
    fulfilled: boolean;
    resultHash?: string;
    storagePointer?: string;
    node?: string;
}

export function useGlobalHistory() {
    const [history, setHistory] = useState<GlobalInference[]>([]);
    const [loading, setLoading] = useState(true);
    const client = usePublicClient();

    const fetchHistory = async () => {
        if (!client || CONTRACT_ADDRESS.startsWith('0xYour') || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch current block to define range
            const currentBlock = await client.getBlockNumber();
            const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0);

            // 1. Fetch all InferenceRequested events
            const requestLogs = await client.getLogs({
                address: CONTRACT_ADDRESS as `0x${string}`,
                event: parseAbiItem('event InferenceRequested(uint256 indexed requestId, address indexed requester, bytes32 promptHash, string modelId, uint256 timestamp)'),
                fromBlock
            });

            // 2. Fetch all InferenceResultSubmitted events
            const resultLogs = await client.getLogs({
                address: CONTRACT_ADDRESS as `0x${string}`,
                event: parseAbiItem('event InferenceResultSubmitted(uint256 indexed requestId, bytes32 resultHash, string storagePointer, address indexed node, uint256 timestamp)'),
                fromBlock
            });

            // 3. Map results for quick lookup
            const resultsMap = new Map();
            resultLogs.forEach(log => {
                const { requestId, resultHash, storagePointer, node } = log.args;
                resultsMap.set(requestId?.toString(), { resultHash, storagePointer, node });
            });

            // 4. Combine into final history
            const formattedHistory: GlobalInference[] = requestLogs.map(log => {
                const { requestId, requester, promptHash, modelId, timestamp } = log.args;
                const result = resultsMap.get(requestId?.toString());

                return {
                    requestId: requestId as bigint,
                    requester: requester as string,
                    promptHash: promptHash as string,
                    modelId: modelId as string,
                    timestamp: timestamp as bigint,
                    fulfilled: !!result,
                    resultHash: result?.resultHash,
                    storagePointer: result?.storagePointer,
                    node: result?.node
                };
            });

            // Sort by latest first
            setHistory(formattedHistory.sort((a, b) => Number(b.timestamp - a.timestamp)));
        } catch (error) {
            console.error('Error fetching global history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();

        // Optional: Set up real-time listener
        const unwatch = client?.watchEvent({
            address: CONTRACT_ADDRESS as `0x${string}`,
            onLogs: () => fetchHistory()
        });

        return () => {
            if (unwatch) unwatch();
        };
    }, [client]);

    return { history, loading, refresh: fetchHistory };
}
