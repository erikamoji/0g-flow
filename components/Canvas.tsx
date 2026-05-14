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
import { MemoryNode } from './nodes/MemoryNode';
import { GradientEdge } from './edges/GradientEdge';

const nodeTypesMap = {
  data_input: InputNode,
  ai_compute: LogicNode,
  storage_anchor: AnchorNode,
  memory_store: MemoryNode,
};

const edgeTypesMap = {
  gradient: GradientEdge,
};

const initialNodes: Node[] = [
  {
    id: 'input-demo',
    type: 'data_input',
    position: { x: 80, y: 180 },
    data: {
      name: 'Market Data Feed',
      source: 'manual',
      nodeId: 'IN·01',
      payload: '{\n  "asset": "BTC",\n  "price": 67420,\n  "volume_24h": 38291043200\n}',
    },
  },
  {
    id: 'logic-demo',
    type: 'ai_compute',
    position: { x: 420, y: 180 },
    data: {
      name: 'Signal Analyzer',
      model: 'deepseek-chat-v3',
      sealed: true,
      nodeId: 'LX·01',
      instruction: 'Analyze the market data. Return BUY, SELL, or HOLD with a confidence score 0–100.',
    },
  },
  {
    id: 'anchor-demo',
    type: 'storage_anchor',
    position: { x: 760, y: 180 },
    data: {
      name: 'Store Analysis',
      bucket: 'defi / signals',
      nodeId: 'AN·01',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-demo-1',
    source: 'input-demo',
    sourceHandle: 'output',
    target: 'logic-demo',
    targetHandle: 'input',
    type: 'gradient',
    data: { isRunning: false },
  },
  {
    id: 'e-demo-2',
    source: 'logic-demo',
    sourceHandle: 'output',
    target: 'anchor-demo',
    targetHandle: 'input',
    type: 'gradient',
    data: { isRunning: false },
  },
];

interface CanvasProps {
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  isRunning?: boolean;
  externalNodes?: Node[] | null;
  externalEdges?: Edge[] | null;
}

export function Canvas({ onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback, isRunning = false, externalNodes, externalEdges }: CanvasProps) {
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

  useEffect(() => {
    if (externalNodes) setNodes(externalNodes);
  }, [externalNodes, setNodes]);

  useEffect(() => {
    if (externalEdges) setEdges(externalEdges);
  }, [externalEdges, setEdges]);

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
