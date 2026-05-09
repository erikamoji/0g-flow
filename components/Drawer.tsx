'use client';

import React, { useState } from 'react';
import type { Manifest } from '@/lib/manifestCompiler';
import type { ExecutionLog } from '@/lib/executionLogger';

interface DrawerProps {
  logs: ExecutionLog[];
  manifest: Manifest | null;
  isRunning: boolean;
}

export function Drawer({ logs, manifest, isRunning }: DrawerProps) {
  const [tab, setTab] = useState<'receipt' | 'logs' | 'json' | 'trace'>('logs');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className={`drawer ${collapsed ? 'collapsed' : ''}`} style={{ height: collapsed ? 44 : 320 }}>
      <button aria-label="Toggle drawer" className="drawer-handle" onClick={() => setCollapsed(c => !c)} style={{ border: 0, padding: 0 }} />
      <div className="drawer-head">
        <div className="drawer-tabs">
          {(['receipt', 'logs', 'json', 'trace'] as const).map(t => (
            <button key={t} className={`drawer-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="drawer-meta">
          {isRunning ? (
            <>
              <span className="dot idle" />
              <span className="eyebrow" style={{ color: 'var(--idle-500)' }}>RUNNING</span>
            </>
          ) : (
            <>
              <span className="dot ok" />
              <span className="eyebrow" style={{ color: 'var(--ok-500)' }}>{logs.length > 0 ? 'COMPLETE' : 'IDLE'}</span>
            </>
          )}
          <span className="eyebrow">{logs.length} EVENTS</span>
        </div>
      </div>

      {!collapsed && (
        <div className="drawer-body">
          <div className="drawer-sidebar">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Recent Runs</div>
            <div className="run-row active">
              <span
                className={`dot ${isRunning ? 'idle' : logs.some(l => l.level === 'error') ? 'err' : 'ok'}`}
              />
              <div className="col">
                <div className="id">{manifest?.workflow_id || 'run-current'}</div>
                <div className="when">
                  {isRunning ? 'IN PROGRESS' : logs.length > 0 ? 'JUST NOW' : 'NO RUN YET'}
                </div>
              </div>
              <div className="right">
                <div className="dur">{logs.length} STEPS</div>
              </div>
            </div>
          </div>

          <div className="drawer-main">
            {tab === 'receipt' && (
              <>
                {!manifest ? (
                  <div className="eyebrow">Deploy a workflow to see the receipt.</div>
                ) : (
                  <>
                    <div className="receipt-grid">
                      <div className="kv">
                        <div className="l">Workflow ID</div>
                        <div className="v">{manifest.workflow_id}</div>
                      </div>
                      <div className="kv">
                        <div className="l">Owner</div>
                        <div className="v tx">{manifest.owner}</div>
                      </div>
                      <div className="kv">
                        <div className="l">Nodes</div>
                        <div className="v">{manifest.nodes.length}</div>
                      </div>
                      <div className="kv">
                        <div className="l">Edges</div>
                        <div className="v">{manifest.edges.length}</div>
                      </div>
                    </div>

                    <div className="steps">
                      {manifest.nodes.map(n => {
                        const kind =
                          n.type === 'data_input'
                            ? 'input'
                            : n.type === 'ai_compute'
                              ? 'logic'
                              : 'anchor';
                        const stepLogs = logs.filter(l => l.nodeId === n.id);
                        const status =
                          stepLogs.some(l => l.level === 'error')
                            ? 'err'
                            : stepLogs.some(l => l.level === 'success')
                              ? 'ok'
                              : 'idle';
                        return (
                          <div key={n.id} className={`step ${kind}`}>
                            <span className="pip" />
                            <div>
                              <div className="name">{n.id}</div>
                              <div className="sub">
                                {n.type.replace('_', ' · ').toUpperCase()}
                              </div>
                            </div>
                            <div className="right">
                              <span className={`dot ${status}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'logs' && (
              <div className="logs">
                {logs.length === 0 ? (
                  <div className="line">
                    <span className="t" />
                    <span className="lvl" />
                    <span className="msg" style={{ color: 'var(--fg-3)' }}>
                      Deploy a workflow to see logs.
                    </span>
                  </div>
                ) : (
                  logs.map(l => {
                    const t = new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false });
                    const lvl =
                      l.level === 'success'
                        ? 'ok'
                        : l.level === 'error'
                          ? 'err'
                          : l.level === 'warn'
                            ? 'warn'
                            : 'info';
                    return (
                      <div key={l.id} className="line">
                        <span className="t">{t}</span>
                        <span className={`lvl ${lvl}`}>{lvl.toUpperCase()}</span>
                        <span className="msg">
                          {l.message}
                          {l.transactionHash && (
                            <a
                              href={`https://explorer.0g.ai/tx/${l.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--input-300)', marginLeft: 8 }}
                            >
                              view tx →
                            </a>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'json' && (
              <pre className="json">
                {manifest
                  ? JSON.stringify(manifest, null, 2)
                  : '// Deploy a workflow to see its compiled JSON manifest.'}
              </pre>
            )}

            {tab === 'trace' && (
              <div className="eyebrow" style={{ padding: 12 }}>
                Trace view coming soon — sealed-inference attestations will render here.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
