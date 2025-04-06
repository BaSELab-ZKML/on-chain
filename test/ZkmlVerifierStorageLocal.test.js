const { expect } = require("chai");
const hre = require("hardhat");

// Import keccak256 and utf8 conversion utilities
const { keccak256 } = require("@ethersproject/keccak256");
const { toUtf8Bytes: toUtf8 } = require("@ethersproject/strings");

describe("ZKMLPublicValsStorage", function () {
  let ZKMLPublicValsStorage, contract;
  let approver1, approver2, approver3, attacker;
  const requiredApprovals = 2;

  beforeEach(async () => {
    [approver1, approver2, approver3, attacker] = await hre.ethers.getSigners();

    const ZKMLPublicValsStorage = await hre.ethers.getContractFactory("ZKMLPublicValsStorage");
    contract = await ZKMLPublicValsStorage.deploy(
      [approver1.address, approver2.address, approver3.address],
      requiredApprovals
    );

    await contract.waitForDeployment(); // Replaces deprecated `.deployed()`
  });

  it("should correctly store the list of approvers", async () => {
    const result = await contract.getApprovers();
    expect(result).to.include.members([approver1.address, approver2.address, approver3.address]);
  });

  it("should not store public_vals without any approval", async () => {
    const hash = keccak256(toUtf8("public_vals_1"));
    const stored = await contract.isStored(hash);
    expect(stored).to.equal(false);
  });

  it("should store public_vals after 2 valid approvals", async () => {
    const hash = keccak256(toUtf8("public_vals_2"));

    await contract.connect(approver1).approveAndStore(hash);
    let stored = await contract.isStored(hash);
    expect(stored).to.equal(false); // Only 1 approval so far

    await contract.connect(approver2).approveAndStore(hash);
    stored = await contract.isStored(hash);
    expect(stored).to.equal(true); // 2 approvals complete
  });

  it("should reject duplicate approvals from the same approver", async () => {
    const hash = keccak256(toUtf8("public_vals_3"));

    await contract.connect(approver1).approveAndStore(hash);

    // Should revert on duplicate approval
    await expect(
      contract.connect(approver1).approveAndStore(hash)
    ).to.be.revertedWith("Already approved");
  });

  it("should reject approval from non-approver", async () => {
    const hash = keccak256(toUtf8("public_vals_4"));

    await expect(
      contract.connect(attacker).approveAndStore(hash)
    ).to.be.revertedWith("Not an approver");
  });

  it("should reject additional approvals after public_vals is stored", async () => {
    const hash = keccak256(toUtf8("public_vals_5"));

    await contract.connect(approver1).approveAndStore(hash);
    await contract.connect(approver2).approveAndStore(hash);

    // A third approver trying to approve again should be rejected
    await expect(
      contract.connect(approver3).approveAndStore(hash)
    ).to.be.revertedWith("Already stored");
  });
});

