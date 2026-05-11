import { connectorsForWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { og0Testnet } from './chains';

const connectors = connectorsForWallets(
  [{ groupName: 'Installed', wallets: [injectedWallet, metaMaskWallet, coinbaseWallet] }],
  { appName: '0G Flow', projectId: 'none' },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [og0Testnet],
  transports: { [og0Testnet.id]: http() },
  ssr: true,
});
