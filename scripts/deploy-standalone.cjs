const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const artifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/WorkflowRegistry.sol/WorkflowRegistry.json'))
);

const NETWORKS = {
  testnet: { name: '0G Galileo Testnet', rpc: 'https://evmrpc-testnet.0g.ai', chainId: 16602 },
  mainnet: { name: '0G Aristotle Mainnet', rpc: 'https://evmrpc.0g.ai', chainId: 16661 },
};

async function main() {
  const target = process.argv[2];
  const network = NETWORKS[target];
  if (!network) {
    console.error('Usage: node scripts/deploy-standalone.cjs testnet|mainnet');
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('PRIVATE_KEY env var not set');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(network.rpc);
  const wallet = new ethers.Wallet(
    privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
    provider
  );

  console.log(`Network:  ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} A0G`);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  console.log('Deploying WorkflowRegistry...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\nDeployed: ${address}`);
  console.log(`Explorer: https://explorer.0g.ai/address/${address}`);
  console.log(`\nAdd to .env.local:`);
  const envKey = target === 'testnet' ? 'NEXT_PUBLIC_REGISTRY_ADDRESS_16602' : 'NEXT_PUBLIC_REGISTRY_ADDRESS_16661';
  console.log(`${envKey}=${address}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
