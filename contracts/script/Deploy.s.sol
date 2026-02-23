// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying InferenceRegistry...");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerKey);

        InferenceRegistry registry = new InferenceRegistry();

        vm.stopBroadcast();

        console.log("InferenceRegistry deployed at:", address(registry));
        console.log("Owner:", registry.owner());
        console.log("Inference fee:", registry.inferenceFee());
        console.log("Deployer is authorized node:", registry.authorizedNodes(deployer));
    }
}
