// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZkmlVerifierRegistry {
    mapping(address => bytes32) public publicHash;

    event ProofSubmitted(address indexed user, bytes32 hash);

    function submitProof(bytes32 hash) external {
        publicHash[msg.sender] = hash;
        emit ProofSubmitted(msg.sender, hash);
    }

    function isVerified(address user, bytes32 expectedHash) external view returns (bool) {
        return publicHash[user] == expectedHash;
    }

    function getHash(address user) external view returns (bytes32) {
        return publicHash[user];
    }
}

