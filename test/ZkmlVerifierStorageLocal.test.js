// 상단 import 부분 수정!
const { expect } = require("chai");
const hre = require("hardhat");

// utils는 별도로 임포트
const { keccak256, toUtf8Bytes } = require("@ethersproject/keccak256");
const { toUtf8Bytes: toUtf8 } = require("@ethersproject/strings"); // v6 이상에서 안전

describe("ZKMLPublicValsStorage", function () {
  let ZKMLPublicValsStorage, contract;
  let approver1, approver2, approver3, attacker;
  const requiredApprovals = 2;

  beforeEach(async () => {
    [approver1, approver2, approver3, attacker] = await ethers.getSigners();

  const ZKMLPublicValsStorage = await ethers.getContractFactory("ZKMLPublicValsStorage");
  contract = await ZKMLPublicValsStorage.deploy(
    [approver1.address, approver2.address, approver3.address],
    requiredApprovals
  );

  await contract.waitForDeployment(); // ✅ 요걸로 대체
});

  it("approvers 목록이 올바르게 설정되어야 함", async () => {
    const result = await contract.getApprovers();
    expect(result).to.include.members([approver1.address, approver2.address, approver3.address]);
  });

  it("승인 없이 public_vals 저장이 되어선 안됨", async () => {
    const hash = keccak256(toUtf8("public_vals_1")); // ✅ 정확한 방식
    const stored = await contract.isStored(hash);
    expect(stored).to.equal(false);
  });

  it("2명의 approver가 approve하면 저장되어야 함", async () => {
const hash = keccak256(toUtf8("public_vals_2")); // ✅ 정확한 방식

    await contract.connect(approver1).approveAndStore(hash);
    let stored = await contract.isStored(hash);
    expect(stored).to.equal(false); // 아직 1명 승인

    await contract.connect(approver2).approveAndStore(hash);
    stored = await contract.isStored(hash);
    expect(stored).to.equal(true); // 2명 승인 완료
  });

  it("중복 승인은 거부되어야 함", async () => {
const hash = keccak256(toUtf8("public_vals_3")); // ✅ 정확한 방식

    await contract.connect(approver1).approveAndStore(hash);

    // 중복 승인 시 revert 발생
    await expect(
      contract.connect(approver1).approveAndStore(hash)
    ).to.be.revertedWith("Already approved");
  });

  it("approver가 아닌 사용자는 승인할 수 없어야 함", async () => {
const hash = keccak256(toUtf8("public_vals_4")); // ✅ 정확한 방식

    await expect(
      contract.connect(attacker).approveAndStore(hash)
    ).to.be.revertedWith("Not an approver");
  });

  it("이미 저장된 public_vals는 다시 저장할 수 없어야 함", async () => {
const hash = keccak256(toUtf8("public_vals_5")); // ✅ 정확한 방식

    await contract.connect(approver1).approveAndStore(hash);
    await contract.connect(approver2).approveAndStore(hash);

    // 세 번째 approver가 approve 시도 → 이미 저장됨
    await expect(
      contract.connect(approver3).approveAndStore(hash)
    ).to.be.revertedWith("Already stored");
  });
});

