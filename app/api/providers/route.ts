import { NextRequest, NextResponse } from 'next/server';
import { createReadOnlyInferenceBroker } from '@0gfoundation/0g-compute-ts-sdk';
import { getNetwork } from '@/lib/networks';

export async function GET(req: NextRequest) {
  const chainId = parseInt(req.nextUrl.searchParams.get('chainId') || '16602');
  const network = getNetwork(chainId);

  try {
    const broker = await createReadOnlyInferenceBroker(network.rpc);
    const services = await broker.listServiceWithDetail();

    const providers = services.map(s => ({
      provider: s.provider,
      model: s.model,
      url: s.url,
      inputPrice: s.inputPrice.toString(),
      outputPrice: s.outputPrice.toString(),
      verifiability: s.verifiability,
      teeAcknowledged: s.teeSignerAcknowledged,
      uptime: s.healthMetrics?.uptime ?? null,
      avgResponseTime: s.healthMetrics?.avgResponseTime ?? null,
    }));

    return NextResponse.json(providers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
