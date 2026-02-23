import { keccak256, toBytes } from 'viem';

export function hashPrompt(prompt: string): `0x${string}` {
    return keccak256(toBytes(prompt));
}

export function truncateAddress(address: string) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
