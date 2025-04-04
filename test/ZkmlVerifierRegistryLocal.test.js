const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("ZkmlVerifierRegistry", function () {
  let contract;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const ZkmlVerifierRegistry = await ethers.getContractFactory("ZkmlVerifierRegistry");
    contract = await ZkmlVerifierRegistry.deploy();
    await contract.waitForDeployment();
  });

  function hashToBytes32(input) {
    const hash = crypto.createHash("sha256").update(input).digest(); // SHA-256 해시 (32 bytes)
    const hexString = "0x" + hash.toString("hex");
    return hexString;
  }

  it("should store public hash for the sender", async function () {
    const fakePublicVals = Buffer.from("this is a test public_vals"); // 실제 public_vals 역할
    const hashBytes32 = hashToBytes32(fakePublicVals);

    console.log("User1 Address:", user1.address);
    console.log("Fake Public Vals:", fakePublicVals.toString());
    console.log("Computed Hash (Bytes32):", hashBytes32);

    await contract.connect(user1).submitProof(hashBytes32);

    const stored = await contract.publicHash(user1.address);
    console.log("Stored Hash from Contract:", stored);

    expect(stored).to.equal(hashBytes32);
  });

  it("should verify correct hash", async function () {
    const data = Buffer.from("zkml is cool");
    const hashBytes32 = hashToBytes32(data);

    console.log("\n=== [Valid Proof Test] ===");
    console.log("User1 Address:", user1.address);
    console.log("Original Data:", data.toString());
    console.log("Computed Hash:", hashBytes32);

    await contract.connect(user1).submitProof(hashBytes32);

    const isVerified = await contract.isVerified(user1.address, hashBytes32);
    console.log("Verification Result (Correct Hash):", isVerified);
    expect(isVerified).to.be.true;

    const wrongBytes32 = hashToBytes32("wrong data");
    console.log("\nWrong Data Hash (for failure test):", wrongBytes32);

    const isWrong = await contract.isVerified(user1.address, wrongBytes32);
    console.log("Verification Result (Wrong Hash):", isWrong);
    expect(isWrong).to.be.false;
  });
  it("should emit ProofSubmitted event", async () => {
    const data = Buffer.from("event test");
    const hash = hashToBytes32(data);
    await expect(contract.connect(user1).submitProof(hash))
      .to.emit(contract, "ProofSubmitted")
      .withArgs(user1.address, hash);
  });

  it("should return correct hash from getHash()", async () => {
    const data = Buffer.from("check getHash");
    const hash = hashToBytes32(data);
    await contract.connect(user1).submitProof(hash);
    const retrieved = await contract.getHash(user1.address);
    expect(retrieved).to.equal(hash);
  });

});
