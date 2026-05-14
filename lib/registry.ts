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
  {
    name: 'getWorkflow',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'workflowId', type: 'string' },
    ],
    outputs: [
      { name: 'manifestHash', type: 'bytes32' },
      { name: 'storageKey', type: 'string' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'executionCount', type: 'uint256' },
    ],
  },
  {
    name: 'getLatestExecution',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'workflowId', type: 'string' },
    ],
    outputs: [
      { name: 'executionTxHash', type: 'bytes32' },
      { name: 'storageTxHash', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
] as const;

function chainById(chainId: number) {
  return chainId === 16661 ? og0Mainnet : og0Testnet;
}

function walletClient(chainId: number) {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
  return createWalletClient({ chain: chainById(chainId), transport: custom(window.ethereum) });
}

function publicClient(chainId: number) {
  return createPublicClient({ chain: chainById(chainId), transport: http(getNetwork(chainId).rpc) });
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

export async function getWorkflow(
  owner: string,
  workflowId: string,
  chainId: number
): Promise<{ manifestHash: string; storageKey: string; createdAt: number; executionCount: number }> {
  const network = getNetwork(chainId);
  if (!network.registryAddress) throw new Error('Registry not deployed on this network');
  const client = publicClient(chainId);
  const result = await client.readContract({
    address: network.registryAddress,
    abi: ABI,
    functionName: 'getWorkflow',
    args: [owner as `0x${string}`, workflowId],
  }) as readonly [string, string, bigint, bigint];
  return {
    manifestHash: result[0],
    storageKey: result[1],
    createdAt: Number(result[2]),
    executionCount: Number(result[3]),
  };
}

export async function getLatestExecution(
  owner: string,
  workflowId: string,
  chainId: number
): Promise<{ executionTxHash: string; storageTxHash: string; timestamp: number }> {
  const network = getNetwork(chainId);
  if (!network.registryAddress) throw new Error('Registry not deployed on this network');
  const client = publicClient(chainId);
  const result = await client.readContract({
    address: network.registryAddress,
    abi: ABI,
    functionName: 'getLatestExecution',
    args: [owner as `0x${string}`, workflowId],
  }) as readonly [string, string, bigint];
  return {
    executionTxHash: result[0],
    storageTxHash: result[1],
    timestamp: Number(result[2]),
  };
}

export function explorerTx(hash: string) {
  return `https://explorer.0g.ai/tx/${hash}`;
}
