export const INFERENCE_REGISTRY_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "requester", "type": "address" },
            { "indexed": false, "internalType": "bytes32", "name": "promptHash", "type": "bytes32" },
            { "indexed": false, "internalType": "string", "name": "modelId", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "InferenceRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
            { "indexed": false, "internalType": "bytes32", "name": "resultHash", "type": "bytes32" },
            { "indexed": false, "internalType": "string", "name": "storagePointer", "type": "string" },
            { "indexed": true, "internalType": "address", "name": "node", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "InferenceResultSubmitted",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "getRequest",
        "outputs": [
            {
                "components": [
                    { "internalType": "address", "name": "requester", "type": "address" },
                    { "internalType": "bytes32", "name": "promptHash", "type": "bytes32" },
                    { "internalType": "string", "name": "modelId", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                    { "internalType": "bool", "name": "fulfilled", "type": "bool" }
                ],
                "internalType": "struct InferenceRegistry.InferenceRequest",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "getResult",
        "outputs": [
            {
                "components": [
                    { "internalType": "bytes32", "name": "resultHash", "type": "bytes32" },
                    { "internalType": "string", "name": "storagePointer", "type": "string" },
                    { "internalType": "address", "name": "node", "type": "address" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "internalType": "struct InferenceRegistry.InferenceResult",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "inferenceFee",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "promptHash", "type": "bytes32" },
            { "internalType": "string", "name": "modelId", "type": "string" }
        ],
        "name": "requestInference",
        "outputs": [{ "internalType": "uint256", "name": "requestId", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalRequests",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

export const CONTRACT_ADDRESS = "0x915cc86fe0871835e750e93e025080fff9927a3f"; // Updated after deployment
export const WORKER_URL = "http://localhost:3001";
