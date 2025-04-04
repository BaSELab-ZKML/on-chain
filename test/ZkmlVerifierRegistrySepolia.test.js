require("dotenv").config();
const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("ZkmlVerifierRegistry on Sepolia", function () {
  let contract;
  let user1;

  const CONTRACT_ADDRESS = "0x77DA9c6166944eDbfcA74651639bd811A91c1DEF";

  function hashToBytes32(input) {
    const hash = crypto.createHash("sha256").update(input).digest();
    return "0x" + hash.toString("hex");
  }

  before(async () => {
    const provider = new ethers.JsonRpcProvider(process.env.API_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user1 = wallet;

    const ZkmlVerifierRegistry = await ethers.getContractFactory("ZkmlVerifierRegistry", wallet);
    contract = ZkmlVerifierRegistry.attach(CONTRACT_ADDRESS);
  });

  it("should submit and verify proof on Sepolia", async () => {
    const data = Buffer.from("zkml sepolia test");
    const hash = hashToBytes32(data);

    const tx = await contract.connect(user1).submitProof(hash);
    await tx.wait();

    const stored = await contract.publicHash(user1.address);
    console.log("Stored hash:", stored);
    expect(stored).to.equal(hash);

    const verified = await contract.isVerified(user1.address, hash);
    console.log("Verified:", verified);
    expect(verified).to.be.true;
  });
});

