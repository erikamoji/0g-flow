import { Node, Edge } from 'reactflow';

export interface ManifestNode {
  id: string;
  type: string;
  parameters: Record<string, any>;
}

export interface ManifestEdge {
  source: string;
  target: string;
}

export interface Manifest {
  workflow_id: string;
  metadata: {
    name: string;
    owner: string;
  };
  nodes: ManifestNode[];
  edges: ManifestEdge[];
}

export function compileManifest(
  nodes: Node[],
  edges: Edge[],
  workflowName: string = 'VM0048 Verification Swarm',
  owner: string = '0xUserWallet'
): Manifest {
  const manifestNodes: ManifestNode[] = nodes.map((node) => {
    const baseParams: Record<string, any> = {};

    if (node.type === 'trigger') {
      baseParams.mock_payload = '{ "carbon_data": 150 }';
    } else if (node.type === '0g_inference') {
      baseParams.model_id = 'qwen-2.5-7b-instruct';
      baseParams.system_prompt = 'Run methodology validation...';
      const triggerNode = nodes.find((n) => n.type === 'trigger');
      if (triggerNode) {
        baseParams.input_ref = `{{${triggerNode.id}.output.mock_payload}}`;
      }
    } else if (node.type === '0g_storage_write') {
      const inferenceNode = nodes.find((n) => n.type === '0g_inference');
      if (inferenceNode) {
        baseParams.value_ref = `{{${inferenceNode.id}.output.reasoning}}`;
      }
    }

    return {
      id: node.id,
      type: node.type || 'unknown',
      parameters: baseParams,
    };
  });

  const manifestEdges: ManifestEdge[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  return {
    workflow_id: `wf_${Date.now()}`,
    metadata: {
      name: workflowName,
      owner: owner,
    },
    nodes: manifestNodes,
    edges: manifestEdges,
  };
}
