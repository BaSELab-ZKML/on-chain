async function main() {
  const Contract = await ethers.getContractFactory("ZkmlVerifierRegistry");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

