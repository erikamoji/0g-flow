'use client';

import { NODE_TYPES, NodeType } from '@/lib/nodeTypes';

export function Sidebar() {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: NodeType
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <div className="w-64 bg-gray-900 text-white p-6 border-r border-gray-800 shadow-lg overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">0G Flow</h1>
        <p className="text-gray-400 text-sm mt-1">Visual Agent Builder</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">Nodes</h2>
        <p className="text-xs text-gray-500 mb-4">Drag nodes onto the canvas</p>

        <div className="space-y-3">
          {(Object.entries(NODE_TYPES) as Array<[NodeType, any]>).map(
            ([key, config]) => (
              <div
                key={key}
                draggable
                onDragStart={(e) => onDragStart(e, key)}
                className="p-3 bg-gray-800 rounded-lg cursor-move hover:bg-gray-700 transition-colors border-l-4"
                style={{
                  borderLeftColor: {
                    trigger: '#3b82f6',
                    '0g_inference': '#f59e0b',
                    '0g_storage_write': '#10b981',
                  }[key],
                }}
              >
                <div className="font-semibold text-sm">
                  {config.icon} {config.label}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {config.description}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 mt-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Info</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Create a decentralized workflow by connecting trigger, inference, and
          storage nodes. Click "Deploy" to compile to JSON manifest.
        </p>
      </div>
    </div>
  );
}
