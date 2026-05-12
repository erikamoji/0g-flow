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
    storageExplorer: 'https://storagescan-newton.0g.ai',
    registryAddress: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_16602 ?? '') as `0x${string}`,
    models: ['Qwen2.5-7B-Instruct', 'GLM-4-9B-Chat'],
  },
  16661: {
    name: '0G Aristotle Mainnet',
    rpc: 'https://evmrpc.0g.ai',
    storageIndexer: 'https://indexer-storage-turbo.0g.ai',
    storageExplorer: 'https://storagescan-newton.0g.ai',
    registryAddress: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_16661 ?? '') as `0x${string}`,
    models: ['glm-5', 'deepseek-chat-v3', 'Qwen3-VL-30B'],
  },
};

export function getNetwork(chainId: number): NetworkConfig {
  return NETWORKS[chainId] ?? NETWORKS[16602];
}
