import axios from 'axios';
import { Manifest } from './manifestCompiler';
import { ExecutionLogger } from './executionLogger';
import { resolveParametersObject, StateStore } from './variableResolver';

export interface ExecutionContext {
  [nodeId: string]: any;
}

export interface ExecutionResult {
  success: boolean;
  workflowId: string;
  results: ExecutionContext;
  error?: string;
  logs: any[];
}

const OG_ROUTER_API = 'https://router-api.0g.ai/v1';
const OG_RPC_URL = 'https://test-rpc.0g.ai';

class ManifestExecutor {
  private manifest: Manifest;
  private context: ExecutionContext = {};
  private logger: ExecutionLogger;
  private successCount = 0;
  private failureCount = 0;

  constructor(manifest: Manifest, logger?: ExecutionLogger) {
    this.manifest = manifest;
    this.logger = logger || new ExecutionLogger();
  }

  getLogger(): ExecutionLogger {
    return this.logger;
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

    this.logger.nodeStart(nodeId, node.type, node.parameters);

    try {
      const mockPayload = node.parameters.mock_payload;
      const result = typeof mockPayload === 'string' ? JSON.parse(mockPayload) : mockPayload;
      this.logger.nodeSuccess(nodeId, node.type, result);
      this.successCount++;
      return result;
    } catch (error: any) {
      this.logger.nodeError(nodeId, node.type, error.message);
      this.failureCount++;
      throw error;
    }
  }

  private async executeInferenceNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.parameters);

    try {
      const { resolved: resolvedParams } = resolveParametersObject(node.parameters, this.context);
      const { model_id, system_prompt, input_ref } = resolvedParams;
      const resolvedInput = typeof input_ref === 'string' ? JSON.parse(input_ref) : input_ref;

      this.logger.log('debug', `Calling 0G API with model: ${model_id}`, { input: resolvedInput });

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

      const result = {
        model: model_id,
        reasoning: reasoning,
        input: resolvedInput,
        timestamp: new Date().toISOString(),
      };

      this.logger.nodeSuccess(nodeId, node.type, result);
      this.successCount++;
      return result;
    } catch (error: any) {
      this.logger.nodeError(nodeId, node.type, error.message);
      this.failureCount++;
      throw error;
    }
  }

  private async executeStorageNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.parameters);

    try {
      const { resolved: resolvedParams } = resolveParametersObject(node.parameters, this.context);
      const { value_ref } = resolvedParams;
      const resolvedValue = typeof value_ref === 'string' ? JSON.parse(value_ref) : value_ref;

      this.logger.log('debug', 'Storing value to 0G network', { value: resolvedValue });

      // Simulate storage write - in production, use @0glabs/0g-ts-sdk
      const simulatedHash = `0x${Buffer.from(JSON.stringify(resolvedValue)).toString('hex').substring(0, 64)}`;

      const result = {
        transactionHash: simulatedHash,
        storedValue: resolvedValue,
        timestamp: new Date().toISOString(),
        network: 'og-testnet',
      };

      this.logger.nodeSuccess(nodeId, node.type, result, simulatedHash);
      this.successCount++;
      return result;
    } catch (error: any) {
      this.logger.nodeError(nodeId, node.type, error.message);
      this.failureCount++;
      throw error;
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      this.logger.workflowStart(this.manifest.workflow_id, this.manifest.metadata.name);

      const executionOrder = this.getExecutionOrder();

      for (const nodeId of executionOrder) {
        const node = this.manifest.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

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
      }

      this.logger.workflowComplete(this.manifest.workflow_id, this.successCount, this.failureCount);

      return {
        success: true,
        workflowId: this.manifest.workflow_id,
        results: this.context,
        logs: this.logger.getLogs(),
      };
    } catch (error: any) {
      this.logger.workflowFailed(this.manifest.workflow_id, error.message);
      return {
        success: false,
        workflowId: this.manifest.workflow_id,
        results: this.context,
        error: error.message,
        logs: this.logger.getLogs(),
      };
    }
  }
}

export async function executeManifest(manifest: Manifest, logger?: ExecutionLogger): Promise<ExecutionResult> {
  const executor = new ManifestExecutor(manifest, logger);
  return executor.execute();
}
