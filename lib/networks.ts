export type NetworkConfig = {
  name: string;
  rpc: string;
  storageIndexer: string;
  storageExplorer: string;
  registryAddress: `0x${string}`;
  models: string[];
};

export const NETWORKS: Record<number, NetworkConfig> = {
  16602: {
    name: '0G Galileo Testnet',
    rpc: 'https://evmrpc-testnet.0g.ai',
    storageIndexer: 'https://indexer-storage-testnet-turbo.0g.ai',
    storageExplorer: 'https://storagescan-galileo.0g.ai',
    registryAddress: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_16602 ?? '') as `0x${string}`,
    models: ['zai-org/GLM-5-FP8', 'deepseek/deepseek-chat-v3-0324', 'qwen/qwen3-vl-30b-a3b-instruct'],
  },
  16661: {
    name: '0G Aristotle Mainnet',
    rpc: 'https://evmrpc.0g.ai',
    storageIndexer: 'https://indexer-storage-turbo.0g.ai',
    storageExplorer: 'https://storagescan.0g.ai',
    registryAddress: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_16661 ?? '') as `0x${string}`,
    models: ['zai-org/GLM-5.1-FP8', 'deepseek-v4-pro', '0GM-1.0-35B-A3B', 'qwen/qwen3-vl-30b-a3b-instruct'],
  },
};

export function getNetwork(chainId: number): NetworkConfig {
  return NETWORKS[chainId] ?? NETWORKS[16602];
}
