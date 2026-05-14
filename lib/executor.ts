import axios from 'axios';
import { Manifest } from './manifestCompiler';
import { ExecutionLogger } from './executionLogger';
import { resolveParametersObject } from './variableResolver';
import { getNetwork } from './networks';

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

const OG_STORAGE_INDEXER = process.env.OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';

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

  private async executeDataInputNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.params);

    try {
      const rawJson = node.params.raw_json;
      const result = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      this.logger.nodeSuccess(nodeId, node.type, result);
      this.successCount++;
      return result;
    } catch (error: any) {
      this.logger.nodeError(nodeId, node.type, error.message);
      this.failureCount++;
      throw error;
    }
  }

  private async executeAiComputeNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.params);

    try {
      const { resolved: resolvedParams } = resolveParametersObject(node.params, this.context);
      const { model, instruction, data_source } = resolvedParams;
      const resolvedInput = typeof data_source === 'string' ? JSON.parse(data_source) : data_source;

      const providerUrl = process.env.OG_PROVIDER_URL;
      const instrKey = process.env.INSTRUCT_KEY;
      const endpoint = (providerUrl && instrKey)
        ? `${providerUrl}/v1/proxy/chat/completions`
        : `${getNetwork(this.manifest.chain_id).routerApi}/chat/completions`;
      const apiKey = (providerUrl && instrKey) ? instrKey : process.env.OG_ROUTER_API_KEY;

      this.logger.log('debug', `Calling 0G Compute with model: ${model}`, { input: resolvedInput });

      const response = await axios.post(
        endpoint,
        {
          model: model,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: JSON.stringify(resolvedInput) },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
          },
        }
      );

      const output = response.data.choices?.[0]?.message?.content || '';

      const result = {
        model: model,
        output: output,
        input: resolvedInput,
        timestamp: new Date().toISOString(),
      };

      this.logger.nodeSuccess(nodeId, node.type, result);
      this.successCount++;
      return result;
    } catch (error: any) {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : '';
      const msg = detail ? `${error.message} — ${detail}` : error.message;
      this.logger.nodeError(nodeId, node.type, msg);
      this.failureCount++;
      throw new Error(msg);
    }
  }

  private async executeStorageAnchorNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.params);

    try {
      const { resolved: resolvedParams } = resolveParametersObject(node.params, this.context);
      const { key, payload } = resolvedParams;
      const resolvedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

      this.logger.log('debug', `Queuing storage anchor for client-side signing: ${key}`, { payload: resolvedPayload });

      // Upload is deferred to the browser wallet — server returns pending state
      const result = {
        __pending: true,
        nodeId,
        key,
        payload: resolvedPayload,
        timestamp: new Date().toISOString(),
      };

      this.logger.log('info', `Storage anchor queued — waiting for wallet signature`, { nodeId, key });
      this.successCount++;
      return result;
    } catch (error: any) {
      this.logger.nodeError(nodeId, node.type, error.message);
      this.failureCount++;
      throw error;
    }
  }

  private async executeMemoryStoreNode(nodeId: string): Promise<any> {
    const node = this.manifest.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.logger.nodeStart(nodeId, node.type, node.params);

    try {
      const { resolved: resolvedParams } = resolveParametersObject(node.params, this.context);
      const { mode, key } = resolvedParams;

      if (mode === 'read') {
        const rootHash = resolvedParams.root_hash;
        if (!rootHash) throw new Error('memory_store read mode requires root_hash');

        this.logger.log('debug', `Fetching memory from 0G Storage: ${rootHash}`, { key });
        const response = await axios.get(`${OG_STORAGE_INDEXER}/file`, {
          params: { root: rootHash },
          timeout: 15000,
        });

        const output = response.data;
        this.logger.nodeSuccess(nodeId, node.type, { mode: 'read', key, rootHash, output });
        this.successCount++;
        return { mode: 'read', key, rootHash, output };
      }

      // write mode — deferred to browser wallet like storage_anchor
      const resolvedPayload = typeof resolvedParams.payload === 'string'
        ? JSON.parse(resolvedParams.payload)
        : resolvedParams.payload;

      this.logger.log('debug', `Queuing memory write for client-side signing: ${key}`, { payload: resolvedPayload });

      const result = {
        __pending: true,
        nodeId,
        key,
        payload: resolvedPayload,
        timestamp: new Date().toISOString(),
      };

      this.logger.log('info', `Memory write queued — waiting for wallet signature`, { nodeId, key });
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
      this.logger.workflowStart(this.manifest.workflow_id, `Workflow (${this.manifest.owner})`);

      const executionOrder = this.getExecutionOrder();

      for (const nodeId of executionOrder) {
        const node = this.manifest.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        let result;
        switch (node.type) {
          case 'data_input':
            result = await this.executeDataInputNode(nodeId);
            break;
          case 'ai_compute':
            result = await this.executeAiComputeNode(nodeId);
            break;
          case 'storage_anchor':
            result = await this.executeStorageAnchorNode(nodeId);
            break;
          case 'memory_store':
            result = await this.executeMemoryStoreNode(nodeId);
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
