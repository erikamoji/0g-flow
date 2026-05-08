import { useAccount } from 'wagmi';

export function useWalletAddress() {
  const { address, isConnected } = useAccount();
  return { address, isConnected };
}
