import { Node, Edge } from 'reactflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodeChain: string[]; // display hint: ordered node type labels
  nodes: Node[];
  edges: Edge[];
}

const edge = (source: string, target: string): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  sourceHandle: 'output',
  targetHandle: 'input',
  type: 'gradient',
  data: { isRunning: false },
});

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'summarize-store',
    name: 'Summarize & Store',
    description: 'Feed raw data into 0G Compute for AI summarization, then anchor the result to 0G Storage.',
    nodeChain: ['Input', 'Compute', 'Storage'],
    nodes: [
      {
        id: 'tpl-input-1',
        type: 'data_input',
        position: { x: 100, y: 200 },
        data: { source: 'manual', payload: '{"request_id":"1001","content":"Sample input text for summarization"}' },
      },
      {
        id: 'tpl-compute-1',
        type: 'ai_compute',
        position: { x: 420, y: 200 },
        data: { model: 'glm-4', instruction: 'Summarize the input text into 2-3 concise sentences.', sealed: true },
      },
      {
        id: 'tpl-anchor-1',
        type: 'storage_anchor',
        position: { x: 740, y: 200 },
        data: { bucket: 'summaries' },
      },
    ],
    edges: [
      edge('tpl-input-1', 'tpl-compute-1'),
      edge('tpl-compute-1', 'tpl-anchor-1'),
    ],
  },
  {
    id: 'store-memory',
    name: 'Store in Memory',
    description: 'Run AI inference on input data, then persist the output as addressable memory on 0G Storage.',
    nodeChain: ['Input', 'Compute', 'Memory Write'],
    nodes: [
      {
        id: 'tpl-input-2',
        type: 'data_input',
        position: { x: 100, y: 200 },
        data: { source: 'manual', payload: '{"request_id":"1002","content":"Agent state to analyze and remember"}' },
      },
      {
        id: 'tpl-compute-2',
        type: 'ai_compute',
        position: { x: 420, y: 200 },
        data: { model: 'glm-4', instruction: 'Analyze the input and extract key facts as structured JSON.', sealed: true },
      },
      {
        id: 'tpl-memory-w',
        type: 'memory_store',
        position: { x: 740, y: 200 },
        data: { mode: 'write', memKey: 'agent_memory' },
      },
    ],
    edges: [
      edge('tpl-input-2', 'tpl-compute-2'),
      edge('tpl-compute-2', 'tpl-memory-w'),
    ],
  },
  {
    id: 'read-memory',
    name: 'Read from Memory',
    description: 'Retrieve a previously stored memory by root hash, pass it through 0G Compute, then anchor the result.',
    nodeChain: ['Memory Read', 'Compute', 'Storage'],
    nodes: [
      {
        id: 'tpl-memory-r',
        type: 'memory_store',
        position: { x: 100, y: 200 },
        data: { mode: 'read', memKey: 'agent_memory', rootHash: '' },
      },
      {
        id: 'tpl-compute-3',
        type: 'ai_compute',
        position: { x: 420, y: 200 },
        data: { model: 'glm-4', instruction: 'Using the retrieved memory context, generate a concise report.', sealed: true },
      },
      {
        id: 'tpl-anchor-3',
        type: 'storage_anchor',
        position: { x: 740, y: 200 },
        data: { bucket: 'reports' },
      },
    ],
    edges: [
      edge('tpl-memory-r', 'tpl-compute-3'),
      edge('tpl-compute-3', 'tpl-anchor-3'),
    ],
  },
];
