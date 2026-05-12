import { Chain } from 'viem';

export const og0Mainnet: Chain = {
  id: 16661,
  name: '0G Aristotle Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G Token',
    symbol: 'A0G',
  },
  rpcUrls: {
    public: { http: ['https://evmrpc.0g.ai'] },
    default: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://explorer.0g.ai',
    },
  },
};

export const og0Testnet: Chain = {
  id: 16602,
  name: '0G Galileo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G Token',
    symbol: 'A0G',
  },
  rpcUrls: {
    public: { http: ['https://evmrpc-testnet.0g.ai'] },
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://explorer.0g.ai',
    },
  },
  testnet: true,
};
