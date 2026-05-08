'use client';

import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo } from 'react';
import { TriggerNode } from './nodes/TriggerNode';
import { InferenceNode } from './nodes/InferenceNode';
import { StorageNode } from './nodes/StorageNode';

const nodeTypesMap = {
  trigger: TriggerNode,
  '0g_inference': InferenceNode,
  '0g_storage_write': StorageNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface CanvasProps {
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export function Canvas({ onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => nodeTypesMap, []);

  const handleNodesChange = (changes: any) => {
    onNodesChange(changes);
    setNodes((nds) => {
      onNodesChangeCallback?.(nds);
      return nds;
    });
  };

  const handleEdgesChange = (changes: any) => {
    onEdgesChange(changes);
    setEdges((eds) => {
      onEdgesChangeCallback?.(eds);
      return eds;
    });
  };

  const onConnect = (connection: Connection) => {
    setEdges((eds) => {
      const updated = addEdge(connection, eds);
      onEdgesChangeCallback?.(updated);
      return updated;
    });
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) {
      return;
    }

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: `${type} node` },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      onNodesChangeCallback?.(updated);
      return updated;
    });
  };

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
