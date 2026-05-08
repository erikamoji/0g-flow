import { Node, Edge } from 'reactflow';

export interface ManifestNode {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface ManifestEdge {
  source: string;
  target: string;
}

export interface Manifest {
  workflow_id: string;
  owner: string;
  nodes: ManifestNode[];
  edges: ManifestEdge[];
}

export function compileManifest(
  nodes: Node[],
  edges: Edge[],
  owner: string = '0x0'
): Manifest {
  const manifestNodes: ManifestNode[] = nodes.map((node) => {
    const baseParams: Record<string, any> = {};

    if (node.type === 'data_input') {
      baseParams.raw_json = '{"request_id": "1001", "content": "Sample data"}';
    } else if (node.type === 'ai_compute') {
      baseParams.model = 'qwen-2.5-7b-instruct';
      baseParams.instruction = 'Analyze the input data and provide a structured summary.';
      baseParams.verifiable_execution = false;

      // Find the input node that feeds into this one
      const inputEdge = edges.find((e) => e.target === node.id);
      if (inputEdge) {
        baseParams.data_source = `{{${inputEdge.source}.output}}`;
      }
    } else if (node.type === 'storage_anchor') {
      baseParams.key = 'agent_state_log';
      baseParams.persistence_level = 'Standard';

      // Find the logic node that feeds into this one
      const logicEdge = edges.find((e) => e.target === node.id);
      if (logicEdge) {
        baseParams.payload = `{{${logicEdge.source}.output}}`;
      }
    }

    return {
      id: node.id,
      type: node.type || 'unknown',
      params: baseParams,
    };
  });

  const manifestEdges: ManifestEdge[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  return {
    workflow_id: `agnostic_workflow_${Date.now()}`,
    owner: owner,
    nodes: manifestNodes,
    edges: manifestEdges,
  };
}
