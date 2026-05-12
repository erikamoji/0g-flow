import { createWalletClient, createPublicClient, custom, http, keccak256, toBytes } from 'viem';
import { og0Testnet, og0Mainnet } from './chains';
import { getNetwork } from './networks';

const ABI = [
  {
    name: 'registerWorkflow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'workflowId', type: 'string' },
      { name: 'manifestHash', type: 'bytes32' },
      { name: 'storageKey', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'recordExecution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'workflowId', type: 'string' },
      { name: 'executionTxHash', type: 'bytes32' },
      { name: 'storageTxHash', type: 'string' },
    ],
    outputs: [],
  },
] as const;

function chainById(chainId: number) {
  return chainId === 16661 ? og0Mainnet : og0Testnet;
}

function walletClient(chainId: number) {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
  return createWalletClient({ chain: chainById(chainId), transport: custom(window.ethereum) });
}

export async function registerWorkflow(
  chainId: number,
  workflowId: string,
  manifestJson: string,
  storageKey: string
): Promise<`0x${string}`> {
  const network = getNetwork(chainId);
  if (!network.registryAddress) throw new Error('Registry not deployed on this network');
  const client = walletClient(chainId);
  const [address] = await client.getAddresses();
  const manifestHash = keccak256(toBytes(manifestJson)) as `0x${string}`;

  return client.writeContract({
    address: network.registryAddress,
    abi: ABI,
    functionName: 'registerWorkflow',
    args: [workflowId, manifestHash, storageKey],
    account: address,
  });
}

export async function recordExecution(
  chainId: number,
  workflowId: string,
  executionTxHash: string,
  storageTxHash: string
): Promise<`0x${string}`> {
  const network = getNetwork(chainId);
  if (!network.registryAddress) throw new Error('Registry not deployed on this network');
  const client = walletClient(chainId);
  const [address] = await client.getAddresses();

  const execHash = (executionTxHash.startsWith('0x')
    ? executionTxHash.padEnd(66, '0')
    : `0x${executionTxHash.padEnd(64, '0')}`) as `0x${string}`;

  return client.writeContract({
    address: network.registryAddress,
    abi: ABI,
    functionName: 'recordExecution',
    args: [workflowId, execHash, storageTxHash],
    account: address,
  });
}

export function explorerTx(hash: string) {
  return `https://explorer.0g.ai/tx/${hash}`;
}
