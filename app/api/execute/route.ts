import { NextRequest, NextResponse } from 'next/server';
import { executeManifest } from '@/lib/executor';
import { ExecutionLogger } from '@/lib/executionLogger';
import { Manifest } from '@/lib/manifestCompiler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const manifest: Manifest = body.manifest;

    if (!manifest) {
      return NextResponse.json(
        { error: 'Manifest is required' },
        { status: 400 }
      );
    }

    const logger = new ExecutionLogger();
    const result = await executeManifest(manifest, logger);

    return NextResponse.json({
      success: result.success,
      workflowId: result.workflowId,
      logs: result.logs,
      results: result.results,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
