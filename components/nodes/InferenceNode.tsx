'use client';

import { Handle, Position } from 'reactflow';

export function InferenceNode({ data }: { data: any }) {
  return (
    <div className="bg-amber-500 text-white rounded-lg p-4 shadow-lg border-2 border-amber-600 w-48">
      <div className="text-sm font-bold">⚡ 0G Inference</div>
      <div className="text-xs mt-2 opacity-90">AI model execution</div>
      <div className="text-xs mt-1 opacity-75">(qwen-2.5-7b)</div>
      <Handle type="input" position={Position.Top} />
      <Handle type="output" position={Position.Bottom} />
    </div>
  );
}
