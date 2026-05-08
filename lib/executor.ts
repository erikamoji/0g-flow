import axios from 'axios';
import { Manifest } from './manifestCompiler';

export interface ExecutionContext {
  [nodeId: string]: any;
}

export interface ExecutionResult {
  success: boolean;
  workflowId: string;
  results: ExecutionContext;
  error?: string;
}

const OG_ROUTER_API = 'https://router-api.0g.ai/v1';
const OG_RPC_URL = 'https://test-rpc.0g.ai';

class ManifestExecutor {
  private manifest: Manifest;
  private context: ExecutionContext = {};

  constructor(manifest: Manifest) {
    this.manifest = manifest;
  }

  private resolveParameterReferences(value: any, context: ExecutionContext): any {
    if (typeof value !== 'string') return value;

    const refPattern = /\{\{([^}]+)\}\}/g;
    return value.replace(refPattern, (match, ref) => {
      const [nodeId, ...path] = ref.split('.');
      if (context[nodeId] === undefined) {
        console.warn(`Referenced node ${nodeId} not found in context`);
        return match;
      }

      let result = context[nodeId];
      for (const key of path) {
        if (key === 'output') continue;
        result = result[key];
      }
      return result;
    });
  }

  private getExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) throw new Error('Circular dependency detected');

      visiting.add(nodeId);

      const incomingEdges = this.manifest.edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    for (const node of this.manifest.nodes) {
      visit(node.id);
    }

    return order;
  }

  private async executeTriggerNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const mockPayload = node.parameters.mock_payload;
    try {
      return JSON.parse(mockPayload);
    } catch {
      return { raw: mockPayload };
    }
  }

  private async executeInferenceNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const { model_id, system_prompt, input_ref } = node.parameters;
    const resolvedInput = this.resolveParameterReferences(input_ref, this.context);

    console.log(`[Inference] Calling 0G API with model: ${model_id}`);
    console.log(`[Inference] Input: ${JSON.stringify(resolvedInput)}`);

    try {
      const response = await axios.post(
        `${OG_ROUTER_API}/chat/completions`,
        {
          model: model_id,
          messages: [
            { role: 'system', content: system_prompt },
            { role: 'user', content: JSON.stringify(resolvedInput) },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const reasoning = response.data.choices?.[0]?.message?.content || '';

      return {
        model: model_id,
        reasoning: reasoning,
        input: resolvedInput,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Inference] Error calling 0G API:', error.message);
      throw new Error(`Inference execution failed: ${error.message}`);
    }
  }

  private async executeStorageNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const { value_ref } = node.parameters;
    const resolvedValue = this.resolveParameterReferences(value_ref, this.context);

    console.log('[Storage] Storing value to 0G network');
    console.log(`[Storage] Value: ${JSON.stringify(resolvedValue)}`);

    try {
      // Simulate storage write - in production, use @0glabs/0g-ts-sdk
      const simulatedHash = `0x${Buffer.from(JSON.stringify(resolvedValue)).toString('hex').substring(0, 64)}`;

      return {
        transactionHash: simulatedHash,
        storedValue: resolvedValue,
        timestamp: new Date().toISOString(),
        network: 'og-testnet',
      };
    } catch (error: any) {
      console.error('[Storage] Error writing to 0G:', error.message);
      throw new Error(`Storage execution failed: ${error.message}`);
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      console.log(`\n🚀 Executing workflow: ${this.manifest.workflow_id}`);
      console.log(`📋 Workflow: ${this.manifest.metadata.name}`);
      console.log(`👤 Owner: ${this.manifest.metadata.owner}\n`);

      const executionOrder = this.getExecutionOrder();

      for (const nodeId of executionOrder) {
        const node = this.manifest.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        console.log(`⏳ Executing node: ${nodeId} (type: ${node.type})`);

        let result;
        switch (node.type) {
          case 'trigger':
            result = await this.executeTriggerNode(nodeId);
            break;
          case '0g_inference':
            result = await this.executeInferenceNode(nodeId);
            break;
          case '0g_storage_write':
            result = await this.executeStorageNode(nodeId);
            break;
          default:
            throw new Error(`Unknown node type: ${node.type}`);
        }

        this.context[nodeId] = result;
        console.log(`✅ Node ${nodeId} completed\n`);
      }

      console.log(`\n🎉 Workflow execution completed successfully!`);
      console.log(`📊 Final results: ${Object.keys(this.context).length} nodes executed\n`);

      return {
        success: true,
        workflowId: this.manifest.workflow_id,
        results: this.context,
      };
    } catch (error: any) {
      console.error(`\n❌ Workflow execution failed: ${error.message}\n`);
      return {
        success: false,
        workflowId: this.manifest.workflow_id,
        results: this.context,
        error: error.message,
      };
    }
  }
}

export async function executeManifest(manifest: Manifest): Promise<ExecutionResult> {
  const executor = new ManifestExecutor(manifest);
  return executor.execute();
}
