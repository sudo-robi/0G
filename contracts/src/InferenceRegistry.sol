// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InferenceRegistry
/// @notice Verifiable AI Inference Marketplace — the trust layer for decentralized intelligence.
/// @dev Stores cryptographic commitments (hashes) of AI inference requests and results on-chain.
///      Full inference data is stored on 0G storage; only hashes and pointers live here.
contract InferenceRegistry {
    // ─────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────

    struct InferenceRequest {
        address requester;
        bytes32 promptHash;   // keccak256 of the raw prompt
        string  modelId;      // e.g. "llama3-8b-8192"
        uint256 timestamp;
        bool    fulfilled;
    }

    struct InferenceResult {
        bytes32 resultHash;      // keccak256 of the raw output
        string  storagePointer;  // 0G storage CID / locator
        address node;            // inference node that submitted
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────

    address public owner;

    /// @notice Fee (in wei) required to submit an inference request.
    uint256 public inferenceFee = 0.001 ether;

    uint256 private _nextRequestId;

    mapping(uint256 => InferenceRequest) private _requests;
    mapping(uint256 => InferenceResult)  private _results;
    mapping(address => bool)             public  authorizedNodes;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event InferenceRequested(
        uint256 indexed requestId,
        address indexed requester,
        bytes32         promptHash,
        string          modelId,
        uint256         timestamp
    );

    event InferenceResultSubmitted(
        uint256 indexed requestId,
        bytes32         resultHash,
        string          storagePointer,
        address indexed node,
        uint256         timestamp
    );

    event NodeAuthorized(address indexed node, bool authorized);
    event FeeUpdated(uint256 newFee);
    event FeeWithdrawn(address indexed to, uint256 amount);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error InsufficientFee(uint256 required, uint256 provided);
    error RequestNotFound(uint256 requestId);
    error RequestAlreadyFulfilled(uint256 requestId);
    error NotAuthorizedNode(address caller);
    error NotOwner(address caller);
    error ZeroAddress();

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier onlyAuthorizedNode() {
        if (!authorizedNodes[msg.sender]) revert NotAuthorizedNode(msg.sender);
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // Auto-authorize the deployer as the default inference node
        authorizedNodes[msg.sender] = true;
        emit NodeAuthorized(msg.sender, true);
    }

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Submit an inference request. Caller must pay `inferenceFee`.
    /// @param promptHash keccak256 hash of the plain-text prompt (computed client-side)
    /// @param modelId    Model identifier string e.g. "llama3-8b-8192"
    /// @return requestId Unique ID for this inference request
    function requestInference(
        bytes32 promptHash,
        string calldata modelId
    ) external payable returns (uint256 requestId) {
        if (msg.value < inferenceFee) {
            revert InsufficientFee(inferenceFee, msg.value);
        }

        requestId = _nextRequestId++;

        _requests[requestId] = InferenceRequest({
            requester:  msg.sender,
            promptHash: promptHash,
            modelId:    modelId,
            timestamp:  block.timestamp,
            fulfilled:  false
        });

        emit InferenceRequested(
            requestId,
            msg.sender,
            promptHash,
            modelId,
            block.timestamp
        );
    }

    /// @notice Submit the result for an inference request. Only callable by authorized nodes.
    /// @param requestId      ID of the request being fulfilled
    /// @param resultHash     keccak256 hash of the raw output text
    /// @param storagePointer 0G storage CID where full inference package is stored
    function submitResult(
        uint256 requestId,
        bytes32 resultHash,
        string calldata storagePointer
    ) external onlyAuthorizedNode {
        InferenceRequest storage req = _requests[requestId];

        if (req.timestamp == 0) revert RequestNotFound(requestId);
        if (req.fulfilled)       revert RequestAlreadyFulfilled(requestId);

        req.fulfilled = true;

        _results[requestId] = InferenceResult({
            resultHash:      resultHash,
            storagePointer:  storagePointer,
            node:            msg.sender,
            timestamp:       block.timestamp
        });

        emit InferenceResultSubmitted(
            requestId,
            resultHash,
            storagePointer,
            msg.sender,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Retrieve the request metadata for a given ID.
    function getRequest(uint256 requestId)
        external
        view
        returns (InferenceRequest memory)
    {
        if (_requests[requestId].timestamp == 0) revert RequestNotFound(requestId);
        return _requests[requestId];
    }

    /// @notice Retrieve the result for a given request ID.
    function getResult(uint256 requestId)
        external
        view
        returns (InferenceResult memory)
    {
        if (!_requests[requestId].fulfilled) revert RequestNotFound(requestId);
        return _results[requestId];
    }

    /// @notice Total number of requests ever submitted.
    function totalRequests() external view returns (uint256) {
        return _nextRequestId;
    }

    // ─────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Authorize or deauthorize an inference node.
    function setNodeAuthorization(address node, bool authorized) external onlyOwner {
        if (node == address(0)) revert ZeroAddress();
        authorizedNodes[node] = authorized;
        emit NodeAuthorized(node, authorized);
    }

    /// @notice Update the inference fee.
    function setInferenceFee(uint256 newFee) external onlyOwner {
        inferenceFee = newFee;
        emit FeeUpdated(newFee);
    }

    /// @notice Withdraw accumulated fees to `to`.
    function withdrawFees(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        to.transfer(balance);
        emit FeeWithdrawn(to, balance);
    }

    receive() external payable {}
}
