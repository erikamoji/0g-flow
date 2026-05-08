'use client';

import { Handle, Position } from 'reactflow';

export function TriggerNode({ data }: { data: any }) {
  return (
    <div className="bg-blue-500 text-white rounded-lg p-4 shadow-lg border-2 border-blue-600">
      <div className="text-sm font-bold">▶ Trigger</div>
      <div className="text-xs mt-2 opacity-90">Mock data payload</div>
      <Handle type="output" position={Position.Bottom} />
    </div>
  );
}
