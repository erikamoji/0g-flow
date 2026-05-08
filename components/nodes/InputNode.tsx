'use client';

import { Handle, Position } from 'reactflow';

export function InputNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg p-4 shadow-xl border-2 border-blue-400 w-72">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📥</span>
        <div className="text-sm font-bold">Input</div>
      </div>
      <div className="text-xs text-gray-300 mb-3">
        Define initial data for your workflow
      </div>
      <div className="bg-slate-900 rounded p-2 text-xs font-mono text-gray-200 max-h-32 overflow-y-auto border border-slate-600">
        {data.json_preview || '{"request_id": "1001", "content": "..."}'}
      </div>
      <Handle type="output" position={Position.Right} className="bg-blue-400" />
    </div>
  );
}
