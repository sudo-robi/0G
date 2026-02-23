// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/InferenceRegistry.sol";

contract InferenceRegistryTest is Test {
    InferenceRegistry public registry;

    address public owner    = address(this);
    address public node     = address(0xBEEF);
    address public user     = address(0xCAFE);
    address public stranger = address(0xDEAD);

    uint256 public fee = 0.001 ether;

    bytes32 constant PROMPT_HASH  = keccak256("What is verifiable AI?");
    bytes32 constant RESULT_HASH  = keccak256("Verifiable AI is AI whose outputs can be cryptographically proven.");
    string  constant MODEL_ID     = "llama3-8b-8192";
    string  constant STORAGE_PTR  = "0G_CID_abc123";

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

    function setUp() public {
        registry = new InferenceRegistry();
        // Authorize a separate node wallet
        registry.setNodeAuthorization(node, true);
        // Fund user
        vm.deal(user, 10 ether);
    }

    // ─────────────────────────────────────────────────────────────
    // requestInference
    // ─────────────────────────────────────────────────────────────

    function test_RequestInference_StoresRequest() public {
        vm.prank(user);
        uint256 id = registry.requestInference{value: fee}(PROMPT_HASH, MODEL_ID);

        InferenceRegistry.InferenceRequest memory req = registry.getRequest(id);
        assertEq(req.requester, user);
        assertEq(req.promptHash, PROMPT_HASH);
        assertEq(req.modelId, MODEL_ID);
        assertFalse(req.fulfilled);
        assertEq(registry.totalRequests(), 1);
    }

    function test_RequestInference_EmitsEvent() public {
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit InferenceRequested(0, user, PROMPT_HASH, MODEL_ID, block.timestamp);
        registry.requestInference{value: fee}(PROMPT_HASH, MODEL_ID);
    }

    function test_RequestInference_RevertsIfFeeTooLow() public {
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.InsufficientFee.selector, fee, fee - 1)
        );
        registry.requestInference{value: fee - 1}(PROMPT_HASH, MODEL_ID);
    }

    function test_RequestInference_AcceptsOverpayment() public {
        vm.prank(user);
        uint256 id = registry.requestInference{value: fee * 2}(PROMPT_HASH, MODEL_ID);
        assertEq(id, 0);
    }

    // ─────────────────────────────────────────────────────────────
    // submitResult
    // ─────────────────────────────────────────────────────────────

    function _makeRequest() internal returns (uint256 id) {
        vm.prank(user);
        id = registry.requestInference{value: fee}(PROMPT_HASH, MODEL_ID);
    }

    function test_SubmitResult_StoresResult() public {
        uint256 id = _makeRequest();

        vm.prank(node);
        registry.submitResult(id, RESULT_HASH, STORAGE_PTR);

        InferenceRegistry.InferenceResult memory res = registry.getResult(id);
        assertEq(res.resultHash, RESULT_HASH);
        assertEq(res.storagePointer, STORAGE_PTR);
        assertEq(res.node, node);

        InferenceRegistry.InferenceRequest memory req = registry.getRequest(id);
        assertTrue(req.fulfilled);
    }

    function test_SubmitResult_EmitsEvent() public {
        uint256 id = _makeRequest();

        vm.prank(node);
        vm.expectEmit(true, false, true, true);
        emit InferenceResultSubmitted(id, RESULT_HASH, STORAGE_PTR, node, block.timestamp);
        registry.submitResult(id, RESULT_HASH, STORAGE_PTR);
    }

    function test_SubmitResult_RevertsIfUnauthorized() public {
        uint256 id = _makeRequest();

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.NotAuthorizedNode.selector, stranger)
        );
        registry.submitResult(id, RESULT_HASH, STORAGE_PTR);
    }

    function test_SubmitResult_RevertsIfAlreadyFulfilled() public {
        uint256 id = _makeRequest();

        vm.prank(node);
        registry.submitResult(id, RESULT_HASH, STORAGE_PTR);

        vm.prank(node);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.RequestAlreadyFulfilled.selector, id)
        );
        registry.submitResult(id, RESULT_HASH, STORAGE_PTR);
    }

    function test_SubmitResult_RevertsIfRequestNotFound() public {
        vm.prank(node);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.RequestNotFound.selector, 999)
        );
        registry.submitResult(999, RESULT_HASH, STORAGE_PTR);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────

    function test_SetNodeAuthorization_Works() public {
        registry.setNodeAuthorization(stranger, true);
        assertTrue(registry.authorizedNodes(stranger));

        registry.setNodeAuthorization(stranger, false);
        assertFalse(registry.authorizedNodes(stranger));
    }

    function test_SetNodeAuthorization_RevertsIfNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.NotOwner.selector, stranger)
        );
        registry.setNodeAuthorization(node, false);
    }

    function test_WithdrawFees_Works() public {
        _makeRequest();
        address payable recipient = payable(address(0xABCD));
        uint256 before = recipient.balance;

        registry.withdrawFees(recipient);

        assertEq(recipient.balance, before + fee);
        assertEq(address(registry).balance, 0);
    }

    function test_WithdrawFees_RevertsIfNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(InferenceRegistry.NotOwner.selector, stranger)
        );
        registry.withdrawFees(payable(stranger));
    }

    function test_SetInferenceFee_Works() public {
        registry.setInferenceFee(0.005 ether);
        assertEq(registry.inferenceFee(), 0.005 ether);
    }

    // ─────────────────────────────────────────────────────────────
    // Fuzz
    // ─────────────────────────────────────────────────────────────

    function testFuzz_RequestInference_MultipleRequests(uint8 count) public {
        vm.assume(count > 0 && count <= 50);
        vm.deal(user, uint256(count) * fee);

        for (uint256 i = 0; i < count; i++) {
            vm.prank(user);
            uint256 id = registry.requestInference{value: fee}(PROMPT_HASH, MODEL_ID);
            assertEq(id, i);
        }
        assertEq(registry.totalRequests(), count);
    }
}
