'use client';

import { Handle, Position } from 'reactflow';

export function AnchorNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-lg p-4 shadow-xl border-2 border-emerald-400 w-72">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📌</span>
        <div className="text-sm font-bold">Anchor</div>
        <span className="ml-auto text-xs bg-emerald-700 px-2 py-1 rounded">DB</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1">
            Storage Key
          </label>
          <input
            type="text"
            className="w-full bg-emerald-800 text-white text-xs p-2 rounded border border-emerald-600 focus:outline-none"
            defaultValue={data.key || 'agent_state_log'}
            placeholder="e.g., agent_state_log"
          />
        </div>

        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1">
            Persistence Level
          </label>
          <select className="w-full bg-emerald-800 text-white text-xs p-2 rounded border border-emerald-600 focus:outline-none">
            <option>Standard</option>
            <option>Permanent</option>
          </select>
        </div>
      </div>

      <Handle type="input" position={Position.Left} className="bg-emerald-400" />
    </div>
  );
}
