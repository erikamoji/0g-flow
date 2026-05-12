const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying WorkflowRegistry with:', deployer.address);

  const Registry = await ethers.getContractFactory('WorkflowRegistry');
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log('WorkflowRegistry deployed to:', address);
  console.log('Explorer:', `https://explorer.0g.ai/address/${address}`);
  console.log('\nAdd to .env.local:\nNEXT_PUBLIC_REGISTRY_ADDRESS=' + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
