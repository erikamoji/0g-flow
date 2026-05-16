import OpenAI from 'openai';
import axios from 'axios';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
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
      const { model, instruction, data_source, sealed, provider_address } = resolvedParams;
      const resolvedInput = typeof data_source === 'string' ? JSON.parse(data_source) : data_source;

      if (!provider_address) throw new Error('No provider selected — open the node and pick a provider from the dropdown');
      if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY not set in environment');

      const network = getNetwork(this.manifest.chain_id);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(network.rpc));
      const broker = await createZGComputeNetworkBroker(wallet);

      const { endpoint } = await broker.inference.getServiceMetadata(provider_address);
      const brokerHeaders = await broker.inference.getRequestHeaders(provider_address, JSON.stringify(resolvedInput));

      this.logger.log('debug', `Calling 0G Compute via broker: ${model}${sealed ? ' · verify_tee: true' : ''} · provider=${provider_address.slice(0, 10)}…`, { input: resolvedInput });

      const ogClient = new OpenAI({
        baseURL: endpoint,
        apiKey: 'x', // SDK v6 rejects empty string; real auth is via brokerHeaders
        timeout: 30000,
      });

      const response = await ogClient.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: JSON.stringify(resolvedInput) },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          ...((sealed ? { verify_tee: true } : {}) as object),
        },
        { headers: { ...brokerHeaders } }
      );

      const output = response.choices?.[0]?.message?.content || '';
      const trace = (response as any).x_0g_trace || {};
      const teeVerified = trace.tee_verified ?? null;
      const chatId = (response as any)['zg-res-key'] ?? response.id ?? null;

      if (sealed) {
        const teeMsg =
          teeVerified === true  ? `TEE verified ✓ — provider ${(trace.provider || '').slice(0, 10)}…` :
          teeVerified === false ? `TEE signature FAILED — treat response as untrusted` :
                                  `verify_tee requested — no tee_verified in trace (provider may not support TEE on this network)`;
        this.logger.log(
          teeVerified === false ? 'warn' : 'info',
          teeMsg,
          { tee_verified: teeVerified, provider: trace.provider, request_id: trace.request_id }
        );
      }

      const result = {
        model,
        output,
        input: resolvedInput,
        timestamp: new Date().toISOString(),
        tee_verified: teeVerified,
        og_request_id: trace.request_id ?? null,
        og_provider: trace.provider ?? null,
        og_chat_id: chatId,
      };

      this.logger.nodeSuccess(nodeId, node.type, result);
      this.successCount++;
      return result;
    } catch (error: any) {
      const status = error.status ?? error.response?.status;
      const detail = error.error ? JSON.stringify(error.error) : (error.response?.data ? JSON.stringify(error.response.data) : '');
      const msg = detail ? `[${status}] ${error.message} — ${detail}` : `[${status}] ${error.message}`;
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
        const response = await axios.get(`${getNetwork(this.manifest.chain_id).storageIndexer}/file`, {
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
