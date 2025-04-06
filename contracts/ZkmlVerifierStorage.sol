// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZKMLPublicValsStorage {
    // ========== 설정 ==========

    address[] public approvers;                  // 다중 서명자 목록
    uint256 public requiredApprovals = 2;        // 필요한 승인 수 (기본값 2)

    // ========== 상태 ==========

    // public_vals 해시 => 승인 개수
    mapping(bytes32 => uint256) public approvalCount;

    // public_vals 해시 => (서명자 => 승인 여부)
    mapping(bytes32 => mapping(address => bool)) public approved;

    // 저장 완료된 public_vals 해시 => 저장 여부
    mapping(bytes32 => bool) public storedPublicVals;

    // ========== 생성자 ==========

    constructor(address[] memory _approvers, uint256 _requiredApprovals) {
        require(_approvers.length >= _requiredApprovals, "Insufficient approvers");
        approvers = _approvers;
        requiredApprovals = _requiredApprovals;
    }

    // ========== Modifiers ==========

    modifier onlyApprover() {
        require(isApprover(msg.sender), "Not an approver");
        _;
    }

    // ========== Core Logic ==========

    function approveAndStore(bytes32 publicValsHash) external onlyApprover {
        require(!storedPublicVals[publicValsHash], "Already stored");
        require(!approved[publicValsHash][msg.sender], "Already approved");

        approved[publicValsHash][msg.sender] = true;
        approvalCount[publicValsHash] += 1;

        if (approvalCount[publicValsHash] >= requiredApprovals) {
            storedPublicVals[publicValsHash] = true;
            emit PublicValsStored(publicValsHash);
        }
    }

    function isStored(bytes32 publicValsHash) external view returns (bool) {
        return storedPublicVals[publicValsHash];
    }

    // ========== Helper ==========

    function isApprover(address user) public view returns (bool) {
        for (uint i = 0; i < approvers.length; i++) {
            if (approvers[i] == user) {
                return true;
            }
        }
        return false;
    }

    function getApprovers() external view returns (address[] memory) {
        return approvers;
    }

    // ========== 이벤트 ==========

    event PublicValsStored(bytes32 indexed publicValsHash);
}

