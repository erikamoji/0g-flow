import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { og0Testnet, og0Mainnet } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'none';

const connectors = connectorsForWallets(
  [{ groupName: 'Installed', wallets: [injectedWallet, metaMaskWallet, coinbaseWallet] }],
  { appName: '0G Flow', projectId },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [og0Testnet, og0Mainnet],
  transports: { [og0Testnet.id]: http(), [og0Mainnet.id]: http() },
  ssr: true,
});
