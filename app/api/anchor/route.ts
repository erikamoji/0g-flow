import { NextRequest, NextResponse } from 'next/server';
import { getNetwork } from '@/lib/networks';
import type { PendingAnchor, AnchorResult } from '@/lib/storageClient';

export async function POST(req: NextRequest) {
  try {
    const { pendingAnchors, chainId }: { pendingAnchors: PendingAnchor[]; chainId: number } = await req.json();

    if (!process.env.PRIVATE_KEY) {
      return NextResponse.json({ error: 'PRIVATE_KEY not set' }, { status: 500 });
    }
    if (!Array.isArray(pendingAnchors) || pendingAnchors.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const network = getNetwork(chainId);

    const { ethers } = await import('ethers');
    const { Indexer, MemData } = await import('@0gfoundation/0g-ts-sdk');

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      new ethers.JsonRpcProvider(network.rpc),
    );
    const indexer = new Indexer(network.storageIndexer);
    const results: AnchorResult[] = [];

    for (const anchor of pendingAnchors) {
      const data = new MemData(Buffer.from(JSON.stringify(anchor.payload)));
      const [, treeErr] = await data.merkleTree();
      if (treeErr !== null) throw new Error(`Merkle tree error for ${anchor.key}: ${treeErr}`);
      const [uploaded, err] = await indexer.upload(data, network.rpc, wallet as any);
      if (err !== null) throw new Error(`Storage upload failed for ${anchor.key}: ${err}`);
      if (!uploaded || !('txHash' in uploaded)) throw new Error(`Unexpected upload result for ${anchor.key}`);

      results.push({
        nodeId: anchor.nodeId,
        key: anchor.key,
        transactionHash: uploaded.txHash,
        rootHash: uploaded.rootHash,
        explorer: `${network.storageExplorer}/tx/${uploaded.txHash}`,
        payload: anchor.payload,
        timestamp: new Date().toISOString(),
        network: network.name,
      });
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
