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
import { useEffect, useMemo } from 'react';
import { InputNode } from './nodes/InputNode';
import { LogicNode } from './nodes/LogicNode';
import { AnchorNode } from './nodes/AnchorNode';
import { GradientEdge } from './edges/GradientEdge';

const nodeTypesMap = {
  data_input: InputNode,
  ai_compute: LogicNode,
  storage_anchor: AnchorNode,
};

const edgeTypesMap = {
  gradient: GradientEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface CanvasProps {
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  isRunning?: boolean;
}

export function Canvas({ onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback, isRunning = false }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => nodeTypesMap, []);
  const edgeTypes = useMemo(() => edgeTypesMap, []);

  useEffect(() => {
    onNodesChangeCallback?.(nodes);
  }, [nodes, onNodesChangeCallback]);

  useEffect(() => {
    onEdgesChangeCallback?.(edges);
  }, [edges, onEdgesChangeCallback]);

  // Propagate the running flag into each edge's data so GradientEdge can animate.
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, data: { ...(e.data || {}), isRunning } })));
  }, [isRunning, setEdges]);

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'gradient', data: { isRunning } }, eds));
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

    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="w-full h-full flex-1 flow-canvas-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background gap={24} size={1} color="rgba(255,255,255,0.045)" />
        <Controls style={{ backgroundColor: '#131922', border: '1px solid #232C3C', borderRadius: 8 }} />
        <MiniMap maskColor="rgba(7,9,12,0.6)" nodeColor="#2A7BFF" style={{ backgroundColor: '#0C1117', border: '1px solid #232C3C' }} />
      </ReactFlow>
    </div>
  );
}
