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
        return 'text-ok';
      case 'error':
        return 'text-err';
      case 'warn':
        return 'text-warn';
      case 'debug':
        return 'text-fg-3';
      default:
        return 'text-fg-1';
    }
  };

  const getLogIcon = (level: ExecutionLog['level']): string => {
    switch (level) {
      case 'success':
        return '·';
      case 'error':
        return '×';
      case 'warn':
        return '!';
      case 'debug':
        return '>';
      default:
        return '·';
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
      <div key={log.id} className="font-mono text-xs mb-1 flex items-start gap-2">
        <span className="text-fg-3 w-16 flex-shrink-0">{time}</span>
        <span className={`${color} w-4 flex-shrink-0`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <span className={color}>{log.message}</span>
          {log.transactionHash && (
            <a
              href={`https://explorer.0g.ai/tx/${log.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-input-300 hover:text-input-500 ml-2 underline cursor-pointer"
            >
              View tx →
            </a>
          )}
          {log.data && Object.keys(log.data).length > 0 && (
            <details className="text-fg-3 text-xs mt-1">
              <summary className="cursor-pointer">Details</summary>
              <pre className="bg-bg-1 border border-line-1 rounded-md p-2 mt-1 overflow-x-auto text-fg-2">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-64 bg-bg-1 border-t border-line-2 flex flex-col">
      <div className="bg-bg-2 border-b border-line-2 px-4 py-2 flex items-center justify-between">
        <div className="text-fg-1 text-sm font-semibold tracking-tight">Execution Terminal</div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              <span className="dot idle" />
              <span className="eyebrow text-idle">RUNNING</span>
            </>
          )}
          {logs.length > 0 && !isRunning && (
            <>
              <span className="dot ok" />
              <span className="eyebrow text-ok">COMPLETE</span>
            </>
          )}
        </div>
        <span className="eyebrow">{logs.length} EVENTS</span>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-bg-0 p-4"
      >
        {logs.length === 0 ? (
          <div className="text-fg-3 text-xs flex items-center justify-center h-full font-mono">
            Deploy a workflow to see execution logs
          </div>
        ) : (
          <div>{logs.map(renderLog)}</div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-bg-2 border-t border-line-2 px-4 py-2 text-xs text-fg-3 flex justify-between font-mono">
          <span>
            {logs.filter((l) => l.level === 'success').length} successful ·{' '}
            {logs.filter((l) => l.level === 'error').length} errors
          </span>
          <span>Logs clear on next deploy</span>
        </div>
      )}
    </div>
  );
}
