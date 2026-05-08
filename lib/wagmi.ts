import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { og0Testnet } from './chains';

export const wagmiConfig = getDefaultConfig({
  appName: '0G Flow',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [og0Testnet],
  ssr: true,
});
