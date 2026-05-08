import { EventEmitter } from 'events';

export type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'debug';

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  nodeId?: string;
  nodeType?: string;
  message: string;
  data?: Record<string, any>;
  transactionHash?: string;
}

export type ExecutionEventType =
  | 'workflow-start'
  | 'node-start'
  | 'node-success'
  | 'node-error'
  | 'workflow-complete'
  | 'workflow-error';

export interface ExecutionEvent {
  type: ExecutionEventType;
  timestamp: string;
  log: ExecutionLog;
}

export class ExecutionLogger extends EventEmitter {
  private logs: ExecutionLog[] = [];
  private logCounter = 0;

  constructor() {
    super();
    this.setMaxListeners(10);
  }

  private generateLogId(): string {
    return `log_${++this.logCounter}`;
  }

  private createLog(
    level: LogLevel,
    message: string,
    nodeId?: string,
    nodeType?: string,
    data?: Record<string, any>,
    transactionHash?: string
  ): ExecutionLog {
    return {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      nodeId,
      nodeType,
      message,
      data,
      transactionHash,
    };
  }

  workflowStart(workflowId: string, workflowName: string) {
    const log = this.createLog('info', `🚀 Starting workflow: ${workflowName}`, undefined, undefined, {
      workflowId,
      workflowName,
    });
    this.logs.push(log);
    this.emit('workflow-start', { type: 'workflow-start', timestamp: log.timestamp, log });
  }

  nodeStart(nodeId: string, nodeType: string, parameters: Record<string, any>) {
    const log = this.createLog('debug', `⏳ Executing node: ${nodeId}`, nodeId, nodeType, {
      parameters,
    });
    this.logs.push(log);
    this.emit('node-start', { type: 'node-start', timestamp: log.timestamp, log });
  }

  nodeSuccess(
    nodeId: string,
    nodeType: string,
    result: any,
    transactionHash?: string
  ) {
    let message = `✅ Node ${nodeId} completed successfully`;
    if (transactionHash) {
      message += ` (tx: ${transactionHash.substring(0, 10)}...)`;
    }

    const log = this.createLog(
      'success',
      message,
      nodeId,
      nodeType,
      { result },
      transactionHash
    );
    this.logs.push(log);
    this.emit('node-success', { type: 'node-success', timestamp: log.timestamp, log });
  }

  nodeError(nodeId: string, nodeType: string, error: string) {
    const log = this.createLog(
      'error',
      `❌ Node ${nodeId} failed: ${error}`,
      nodeId,
      nodeType,
      { error }
    );
    this.logs.push(log);
    this.emit('node-error', { type: 'node-error', timestamp: log.timestamp, log });
  }

  workflowComplete(workflowId: string, successCount: number, failureCount: number) {
    const log = this.createLog('success', `🎉 Workflow completed (${successCount} succeeded, ${failureCount} failed)`, undefined, undefined, {
      workflowId,
      successCount,
      failureCount,
    });
    this.logs.push(log);
    this.emit('workflow-complete', { type: 'workflow-complete', timestamp: log.timestamp, log });
  }

  workflowFailed(workflowId: string, error: string) {
    const log = this.createLog(
      'error',
      `❌ Workflow failed: ${error}`,
      undefined,
      undefined,
      { workflowId, error }
    );
    this.logs.push(log);
    this.emit('workflow-error', { type: 'workflow-error', timestamp: log.timestamp, log });
  }

  log(level: LogLevel, message: string, data?: Record<string, any>) {
    const log = this.createLog(level, message, undefined, undefined, data);
    this.logs.push(log);
    this.emit('log', { type: 'log', timestamp: log.timestamp, log });
  }

  getLogs(): ExecutionLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}
