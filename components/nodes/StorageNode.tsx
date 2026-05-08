'use client';

import { Handle, Position } from 'reactflow';

export function StorageNode({ data }: { data: any }) {
  return (
    <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg border-2 border-green-600">
      <div className="text-sm font-bold">💾 0G Storage</div>
      <div className="text-xs mt-2 opacity-90">Decentralized storage</div>
      <Handle type="input" position={Position.Top} />
    </div>
  );
}
