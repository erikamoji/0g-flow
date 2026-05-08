'use client';

import { useEffect, useRef } from 'react';
import { ExecutionLog } from '@/lib/executionLogger';

interface ExecutionTerminalProps {
  logs: ExecutionLog[];
  isRunning?: boolean;
}

export function ExecutionTerminal({ logs, isRunning = false }: ExecutionTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (level: ExecutionLog['level']): string => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'debug':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  const getLogIcon = (level: ExecutionLog['level']): string => {
    switch (level) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warn':
        return '⚠';
      case 'debug':
        return '→';
      default:
        return '•';
    }
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const renderLog = (log: ExecutionLog) => {
    const color = getLogColor(log.level);
    const icon = getLogIcon(log.level);
    const time = formatTimestamp(log.timestamp);

    return (
      <div key={log.id} className="font-mono text-sm mb-1 flex items-start gap-2">
        <span className="text-gray-600 w-12 flex-shrink-0">{time}</span>
        <span className={`${color} w-4 flex-shrink-0`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <span className={color}>{log.message}</span>
          {log.transactionHash && (
            <a
              href={`https://explorer.0g.ai/tx/${log.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 ml-2 underline cursor-pointer"
            >
              View TX →
            </a>
          )}
          {log.data && Object.keys(log.data).length > 0 && (
            <details className="text-gray-500 text-xs mt-1">
              <summary className="cursor-pointer">Details</summary>
              <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-64 bg-gray-900 border-t border-gray-700 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-white font-semibold">Execution Terminal</div>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-xs text-yellow-400">Running</span>
            </div>
          )}
          {logs.length > 0 && !isRunning && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-400">Completed</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500">{logs.length} events</span>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-black p-4 text-gray-100"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 text-sm flex items-center justify-center h-full">
            Deploy a workflow to see execution logs
          </div>
        ) : (
          <div>{logs.map(renderLog)}</div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>
            {logs.filter((l) => l.level === 'success').length} successful •{' '}
            {logs.filter((l) => l.level === 'error').length} errors
          </span>
          <span>Logs auto-clear on new deployment</span>
        </div>
      )}
    </div>
  );
}
