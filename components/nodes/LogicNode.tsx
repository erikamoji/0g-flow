'use client';

import { Handle, Position } from 'reactflow';

export function LogicNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-violet-900 to-violet-950 text-white rounded-lg p-4 shadow-xl border-2 border-violet-500 w-80">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <div className="text-sm font-bold">Logic</div>
        <span className="ml-auto text-xs bg-violet-700 px-2 py-1 rounded">AI</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1">
            Model
          </label>
          <select className="w-full bg-violet-800 text-white text-xs p-2 rounded border border-violet-600 focus:outline-none">
            <option>qwen-2.5-7b-instruct</option>
            <option>glm-5</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1">
            Instruction
          </label>
          <textarea
            className="w-full bg-violet-800 text-white text-xs p-2 rounded border border-violet-600 focus:outline-none h-20 resize-none"
            defaultValue={data.instruction || 'Analyze the input data and provide a structured summary.'}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="verifiable"
            defaultChecked={data.verifiable || false}
            className="w-4 h-4"
          />
          <label htmlFor="verifiable" className="text-xs text-gray-300">
            Verifiable Execution (Sealed Inference)
          </label>
        </div>
      </div>

      <Handle type="input" position={Position.Left} className="bg-violet-400" />
      <Handle type="output" position={Position.Right} className="bg-violet-400" />
    </div>
  );
}
