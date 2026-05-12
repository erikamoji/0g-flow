import { createWalletClient, createPublicClient, custom, http, keccak256, toBytes } from 'viem';
import { og0Testnet } from './chains';

export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? '') as `0x${string}`;

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

function walletClient() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
  return createWalletClient({ chain: og0Testnet, transport: custom(window.ethereum) });
}

export async function registerWorkflow(
  workflowId: string,
  manifestJson: string,
  storageKey: string
): Promise<`0x${string}`> {
  const client = walletClient();
  const [address] = await client.getAddresses();
  const manifestHash = keccak256(toBytes(manifestJson)) as `0x${string}`;

  return client.writeContract({
    address: REGISTRY_ADDRESS,
    abi: ABI,
    functionName: 'registerWorkflow',
    args: [workflowId, manifestHash as `0x${string}`, storageKey],
    account: address,
  });
}

export async function recordExecution(
  workflowId: string,
  executionTxHash: string,
  storageTxHash: string
): Promise<`0x${string}`> {
  const client = walletClient();
  const [address] = await client.getAddresses();

  // pad executionTxHash to bytes32
  const execHash = (executionTxHash.startsWith('0x')
    ? executionTxHash.padEnd(66, '0')
    : `0x${executionTxHash.padEnd(64, '0')}`) as `0x${string}`;

  return client.writeContract({
    address: REGISTRY_ADDRESS,
    abi: ABI,
    functionName: 'recordExecution',
    args: [workflowId, execHash, storageTxHash],
    account: address,
  });
}

export function explorerTx(hash: string) {
  return `https://explorer.0g.ai/tx/${hash}`;
}
