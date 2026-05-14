'use client';

import React, { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import type { Manifest } from '@/lib/manifestCompiler';
import type { ExecutionLog } from '@/lib/executionLogger';
import { getWorkflow, getLatestExecution } from '@/lib/registry';

interface DrawerProps {
  logs: ExecutionLog[];
  manifest: Manifest | null;
  isRunning: boolean;
  nodeCount?: number;
  edgeCount?: number;
}

export function Drawer({ logs, manifest, isRunning, nodeCount = 0, edgeCount = 0 }: DrawerProps) {
  const [tab, setTab] = useState<'receipt' | 'logs' | 'json' | 'verify'>('logs');
  const [collapsed, setCollapsed] = useState(false);
  const chainId = useChainId();
  const { address } = useAccount();
  const [verifyId, setVerifyId] = useState('');
  const [verifyOwner, setVerifyOwner] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    manifestHash: string; storageKey: string; createdAt: number; executionCount: number;
    execTxHash: string; execStorageTx: string; execTimestamp: number;
  } | null>(null);
  const [verifyError, setVerifyError] = useState('');

  return (
    <section className={`drawer ${collapsed ? 'collapsed' : ''}`} style={{ height: collapsed ? 44 : 320 }}>
      <button aria-label="Toggle drawer" className="drawer-handle" onClick={() => setCollapsed(c => !c)} style={{ border: 0, padding: 0 }} />
      <div className="drawer-head">
        <div className="drawer-tabs">
          {(['receipt', 'logs', 'json', 'verify'] as const).map(t => (
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
          <span className="eyebrow" style={{ color: 'var(--fg-4)', borderLeft: '1px solid var(--line-2)', paddingLeft: 12 }}>{nodeCount}N · {edgeCount}E</span>
        </div>
      </div>

      {!collapsed && (
        <div className="drawer-body">
          <div className="drawer-main">

            {tab === 'receipt' && (
              !manifest ? (
                <div className="drawer-empty">Deploy a workflow to see the receipt.</div>
              ) : (
                <div className="dp">
                  <div className="dp-section-head">Manifest</div>
                  <div className="dp-row dp-kv"><span className="dp-k">Workflow ID</span><span className="dp-v">{manifest.workflow_id}</span></div>
                  <div className="dp-row dp-kv"><span className="dp-k">Owner</span><span className="dp-v tx">{manifest.owner}</span></div>
                  <div className="dp-row dp-kv"><span className="dp-k">Nodes</span><span className="dp-v">{manifest.nodes.length}</span></div>
                  <div className="dp-row dp-kv"><span className="dp-k">Edges</span><span className="dp-v">{manifest.edges.length}</span></div>
                  <div className="dp-section-head">Execution</div>
                  {manifest.nodes.map(n => {
                    const kind = n.type === 'data_input' ? 'input' : n.type === 'ai_compute' ? 'logic' : 'anchor';
                    const stepLogs = logs.filter(l => l.nodeId === n.id);
                    const status = stepLogs.some(l => l.level === 'error') ? 'err' : stepLogs.some(l => l.level === 'success') ? 'ok' : 'idle';
                    return (
                      <div key={n.id} className={`dp-row dp-node ${kind}`}>
                        <span className="dp-pip" />
                        <div><div className="dp-nid">{n.id}</div><div className="dp-ntype">{n.type.replace('_', ' · ').toUpperCase()}</div></div>
                        <span className={`dot ${status}`} />
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'logs' && (
              <div className="dp">
                {logs.length === 0 ? (
                  <div className="dp-row dp-log">
                    <span className="dp-t" />
                    <span className="dp-lvl" />
                    <span className="dp-msg drawer-empty">No events yet — deploy a workflow.</span>
                  </div>
                ) : (
                  logs.map(l => {
                    const t = new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false });
                    const lvl = l.level === 'success' ? 'ok' : l.level === 'error' ? 'err' : l.level === 'warn' ? 'warn' : 'info';
                    return (
                      <div key={l.id} className="dp-row dp-log">
                        <span className="dp-t">{t}</span>
                        <span className={`dp-lvl ${lvl}`}>{lvl.toUpperCase()}</span>
                        <span className="dp-msg">
                          {l.message}
                          {l.transactionHash && (
                            <a href={`https://explorer.0g.ai/tx/${l.transactionHash}`} target="_blank" rel="noopener noreferrer">view tx →</a>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'json' && (
              <div className="dp">
                <pre className="dp-json">
                  {manifest ? JSON.stringify(manifest, null, 2) : '// Deploy a workflow to see its compiled JSON manifest.'}
                </pre>
              </div>
            )}

            {tab === 'verify' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div className="drawer-field" style={{ flex: 2 }}>
                    <label>Owner Address</label>
                    <input placeholder={address || '0x…'} value={verifyOwner} onChange={e => setVerifyOwner(e.target.value)} />
                  </div>
                  <div className="drawer-field" style={{ flex: 1 }}>
                    <label>Workflow ID</label>
                    <input placeholder="wf-…" value={verifyId} onChange={e => setVerifyId(e.target.value)} />
                  </div>
                  <button
                    disabled={!verifyId || verifying}
                    onClick={async () => {
                      const owner = verifyOwner.trim() || address || '';
                      if (!owner) { setVerifyError('Connect wallet or enter owner address'); return; }
                      setVerifying(true); setVerifyError(''); setVerifyResult(null);
                      try {
                        const [wf, ex] = await Promise.all([
                          getWorkflow(owner, verifyId.trim(), chainId),
                          getLatestExecution(owner, verifyId.trim(), chainId),
                        ]);
                        setVerifyResult({ manifestHash: wf.manifestHash, storageKey: wf.storageKey, createdAt: wf.createdAt, executionCount: wf.executionCount, execTxHash: ex.executionTxHash, execStorageTx: ex.storageTxHash, execTimestamp: ex.timestamp });
                      } catch (e: unknown) {
                        setVerifyError(e instanceof Error ? e.message : 'Lookup failed');
                      } finally { setVerifying(false); }
                    }}
                    style={{ flexShrink: 0, background: 'var(--brand-grad)', border: 0, borderRadius: 6, color: '#07090C', fontWeight: 600, padding: '0 16px', height: 34, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', cursor: verifyId && !verifying ? 'pointer' : 'not-allowed', opacity: verifyId && !verifying ? 1 : 0.45, transition: 'opacity 120ms' }}
                  >
                    {verifying ? 'Checking…' : 'Verify'}
                  </button>
                </div>
                {verifyError && (
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, color: 'var(--err-500)', letterSpacing: '0.08em' }}>{verifyError}</div>
                )}
                {verifyResult ? (
                  <div className="dp">
                    <div className="dp-section-head">On-chain Record</div>
                    <div className="dp-row dp-kv"><span className="dp-k">Manifest Hash</span><span className="dp-v tx">{verifyResult.manifestHash}</span></div>
                    <div className="dp-row dp-kv"><span className="dp-k">Storage Key</span><span className="dp-v tx">{verifyResult.storageKey}</span></div>
                    <div className="dp-row dp-kv"><span className="dp-k">Created</span><span className="dp-v">{verifyResult.createdAt ? new Date(verifyResult.createdAt * 1000).toLocaleString() : '—'}</span></div>
                    <div className="dp-row dp-kv"><span className="dp-k">Executions</span><span className="dp-v">{verifyResult.executionCount}</span></div>
                    {verifyResult.execTimestamp > 0 && (<>
                      <div className="dp-row dp-kv"><span className="dp-k">Latest Exec Tx</span><span className="dp-v tx"><a href={`https://explorer.0g.ai/tx/${verifyResult.execTxHash}`} target="_blank" rel="noopener noreferrer">{verifyResult.execTxHash.slice(0, 18)}…</a></span></div>
                      <div className="dp-row dp-kv"><span className="dp-k">Storage Tx</span><span className="dp-v tx">{verifyResult.execStorageTx}</span></div>
                      <div className="dp-row dp-kv"><span className="dp-k">Exec Time</span><span className="dp-v">{new Date(verifyResult.execTimestamp * 1000).toLocaleString()}</span></div>
                    </>)}
                  </div>
                ) : (
                  !verifyError && <div className="drawer-empty">Enter a workflow ID to look up its on-chain record.</div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
}
