'use client';

import type { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

export interface PendingAnchor {
  nodeId: string;
  key: string;
  payload: any;
  timestamp: string;
}

export interface AnchorResult {
  nodeId: string;
  key: string;
  transactionHash: string;
  rootHash: string;
  explorer: string;
  payload: any;
  timestamp: string;
  network: string;
}

async function walletClientToSigner(walletClient: WalletClient): Promise<JsonRpcSigner> {
  const { BrowserProvider, JsonRpcSigner } = await import('ethers');
  const { account, chain, transport } = walletClient;
  const network = { chainId: chain!.id, name: chain!.name };
  const provider = new BrowserProvider(transport as any, network);
  return new JsonRpcSigner(provider, account!.address);
}

export async function uploadPendingAnchors(
  pendingAnchors: PendingAnchor[],
  walletClient: WalletClient
): Promise<AnchorResult[]> {
  const { Indexer, MemData } = await import('@0glabs/0g-ts-sdk');

  const evmRpc = process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const indexerRpc = process.env.NEXT_PUBLIC_OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';

  const signer = await walletClientToSigner(walletClient);
  const indexer = new Indexer(indexerRpc);
  const results: AnchorResult[] = [];

  for (const anchor of pendingAnchors) {
    const data = new MemData(Buffer.from(JSON.stringify(anchor.payload)));
    const [uploaded, err] = await indexer.upload(data, evmRpc, signer as any);
    if (err !== null) throw new Error(`Storage upload failed for ${anchor.key}: ${err}`);

    results.push({
      nodeId: anchor.nodeId,
      key: anchor.key,
      transactionHash: uploaded.txHash,
      rootHash: uploaded.rootHash,
      explorer: `https://storagescan-newton.0g.ai/tx/${uploaded.txHash}`,
      payload: anchor.payload,
      timestamp: new Date().toISOString(),
      network: 'og-testnet',
    });
  }

  return results;
}
