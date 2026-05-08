import { Chain } from 'viem';

export const og0Testnet: Chain = {
  id: 16600,
  name: '0G Galileo Testnet',
  network: '0g-galileo',
  nativeCurrency: {
    decimals: 18,
    name: '0G Token',
    symbol: 'A0G',
  },
  rpcUrls: {
    public: { http: ['https://evm-rpc.testnet.0g.ai'] },
    default: { http: ['https://evm-rpc.testnet.0g.ai'] },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://explorer.0g.ai',
    },
  },
  testnet: true,
};
