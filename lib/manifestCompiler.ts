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
    const d = node.data || {};

    if (node.type === 'data_input') {
      baseParams.raw_json = d.payload || '{"request_id": "1001", "content": "Sample data"}';
      baseParams.source = d.source || 'manual';
    } else if (node.type === 'ai_compute') {
      baseParams.model = d.model || 'glm-5';
      baseParams.instruction = d.instruction || 'Analyze the input data and provide a structured summary.';
      baseParams.sealed = d.sealed !== false;

      const inputEdge = edges.find((e) => e.target === node.id);
      if (inputEdge) {
        baseParams.data_source = `{{${inputEdge.source}.output}}`;
      }
    } else if (node.type === 'storage_anchor') {
      baseParams.key = d.bucket || 'agent_state_log';
      baseParams.persistence_level = 'Standard';

      const logicEdge = edges.find((e) => e.target === node.id);
      if (logicEdge) {
        baseParams.payload = `{{${logicEdge.source}.output}}`;
      }
    } else if (node.type === 'memory_store') {
      baseParams.mode = d.mode || 'write';
      baseParams.key = d.memKey || 'agent_memory';

      if (baseParams.mode === 'write') {
        const inputEdge = edges.find((e) => e.target === node.id);
        if (inputEdge) {
          baseParams.payload = `{{${inputEdge.source}.output}}`;
        }
      } else {
        baseParams.root_hash = d.rootHash || '';
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
