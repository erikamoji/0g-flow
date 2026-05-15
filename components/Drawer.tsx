'use client';

import React, { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import type { Manifest } from '@/lib/manifestCompiler';
import type { ExecutionLog } from '@/lib/executionLogger';
import { getWorkflow, getLatestExecution } from '@/lib/registry';

const CHAIN_NAMES: Record<number, string> = {
  16600: '0G TESTNET',
  16602: '0G GALILEO',
  16661: '0G ARISTOTLE',
};

const NODE_COLOR: Record<string, string> = {
  data_input:     'var(--input-300)',
  ai_compute:     'var(--logic-300)',
  storage_anchor: 'var(--anchor-300)',
  memory_store:   'var(--memory-300)',
};

const NODE_LABEL: Record<string, string> = {
  data_input:     'INPUT',
  ai_compute:     'COMPUTE',
  storage_anchor: 'ANCHOR',
  memory_store:   'MEMORY',
};

function barcode(seed: string): string {
  const segs = ['|', '||', '| ', '|||', '| ', '||', '|'];
  return Array.from({ length: 42 }, (_, i) => {
    const n = (seed.charCodeAt(i % seed.length) * (i + 7)) % segs.length;
    return segs[n];
  }).join('').slice(0, 42);
}

const DASH = '·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·';

function ReceiptRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', gap: 8 }}>
      <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-4)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: valueColor || 'var(--fg-1)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{value}</span>
    </div>
  );
}

function ReceiptDash() {
  return <div style={{ fontSize: 9, color: 'var(--fg-4)', letterSpacing: '0.06em', padding: '6px 0', userSelect: 'none' }}>{DASH}</div>;
}

function ExecutionReceipt({ manifest, logs }: { manifest: Manifest; logs: ExecutionLog[] }) {
  const hasLogs = logs.length > 0;
  const firstTs = hasLogs ? new Date(logs[0].timestamp) : null;
  const lastTs  = hasLogs ? new Date(logs[logs.length - 1].timestamp) : null;
  const durationMs = firstTs && lastTs ? lastTs.getTime() - firstTs.getTime() : null;
  const durationStr = durationMs != null ? `${(durationMs / 1000).toFixed(2)}s` : '—';
  const dateStr = firstTs
    ? firstTs.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '—';

  const txLog = [...logs].reverse().find(l => l.transactionHash && l.level === 'success');
  const txHash = txLog?.transactionHash;

  const overallSuccess = hasLogs && !logs.some(l => l.level === 'error');
  const statusLabel = !hasLogs ? 'PENDING' : overallSuccess ? 'COMPLETE' : 'FAILED';
  const statusColor = !hasLogs ? 'var(--fg-4)' : overallSuccess ? 'var(--anchor-300)' : 'var(--err-500)';
  const statusGlow  = !hasLogs ? 'none' : overallSuccess ? '0 0 20px rgba(93,227,165,0.2)' : '0 0 20px rgba(244,113,116,0.2)';

  const chainLabel = CHAIN_NAMES[manifest.chain_id] || `CHAIN ${manifest.chain_id}`;
  const runId = manifest.workflow_id.length > 18 ? manifest.workflow_id.slice(0, 18) + '…' : manifest.workflow_id;
  const owner = manifest.owner.length > 14 ? manifest.owner.slice(0, 6) + '…' + manifest.owner.slice(-4) : manifest.owner;

  const bc = barcode(manifest.workflow_id);

  return (
    <div style={{
      width: 280,
      fontFamily: 'var(--font-jetbrains-mono, monospace)',
      background: 'var(--bg-1)',
      border: '1px solid var(--line-2)',
      borderRadius: 3,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), ' + statusGlow,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* gradient top bar */}
      <div style={{ height: 3, background: 'var(--brand-grad)' }} />

      {/* tear edge */}
      <div style={{
        height: 8, marginBottom: -1,
        background: `radial-gradient(circle at 4px 0, var(--bg-0) 4px, transparent 4px)`,
        backgroundSize: '8px 8px', backgroundRepeat: 'repeat-x',
        backgroundPosition: '0 bottom', borderBottom: '1px dashed var(--line-3)',
      }} />

      <div style={{ padding: '14px 18px 18px' }}>
        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.30em', textTransform: 'uppercase', color: 'var(--fg-1)' }}>0G FLOW</div>
          <div style={{ fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--fg-4)', marginTop: 3 }}>EXECUTION RECEIPT</div>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--fg-4)', marginTop: 1 }}>{chainLabel}</div>
        </div>

        <ReceiptDash />

        <ReceiptRow label="RUN"     value={runId} />
        <ReceiptRow label="DATE"    value={dateStr} />
        <ReceiptRow label="OWNER"   value={owner} valueColor="var(--input-300)" />

        <ReceiptDash />

        {/* nodes */}
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 6 }}>NODES</div>
        {manifest.nodes.map(n => {
          const nodeLogs = logs.filter(l => l.nodeId === n.id);
          const hasErr   = nodeLogs.some(l => l.level === 'error');
          const hasOk    = nodeLogs.some(l => l.level === 'success' || l.level === 'info');
          const nodeStatus = !hasLogs ? '·' : hasErr ? '✗' : hasOk ? '✓' : '·';
          const nodeStatusColor = hasErr ? 'var(--err-500)' : hasOk ? 'var(--anchor-300)' : 'var(--fg-4)';
          const nodeColor = NODE_COLOR[n.type] || 'var(--fg-3)';
          const typeLabel = NODE_LABEL[n.type] || n.type.toUpperCase();
          const idShort = n.id.length > 12 ? n.id.slice(0, 12) + '…' : n.id;
          return (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: nodeColor, flexShrink: 0, boxShadow: `0 0 6px ${nodeColor}` }} />
              <span style={{ flex: 1, fontSize: 10, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idShort}</span>
              <span style={{ fontSize: 9, letterSpacing: '0.10em', color: nodeColor, flexShrink: 0 }}>{typeLabel}</span>
              <span style={{ fontSize: 12, color: nodeStatusColor, fontWeight: 700, flexShrink: 0, width: 12, textAlign: 'center' }}>{nodeStatus}</span>
            </div>
          );
        })}

        <div style={{ borderTop: '1px solid var(--line-1)', marginTop: 6, paddingTop: 6 }}>
          <ReceiptRow label="NODES" value={String(manifest.nodes.length)} />
          <ReceiptRow label="EDGES" value={String(manifest.edges.length)} />
          <ReceiptRow label="EVENTS" value={String(logs.length)} />
          {hasLogs && <ReceiptRow label="DURATION" value={durationStr} valueColor="var(--fg-1)" />}
        </div>

        {txHash && (
          <>
            <ReceiptDash />
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 5 }}>TX HASH</div>
            <a
              href={`https://explorer.0g.ai/tx/${txHash}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, color: 'var(--input-300)', wordBreak: 'break-all', lineHeight: 1.5, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >{txHash}</a>
          </>
        )}

        <ReceiptDash />

        {/* status badge */}
        <div style={{ textAlign: 'center', margin: '8px 0 10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: statusColor,
            border: `1px solid ${statusColor}`,
            borderRadius: 3, padding: '6px 16px',
            opacity: 0.9,
          }}>
            {overallSuccess && hasLogs && <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />}
            {statusLabel}
          </span>
        </div>

        {/* barcode */}
        <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.02em', color: 'var(--fg-3)', lineHeight: 1.1, userSelect: 'none', marginTop: 10 }}>
          <div>{bc}</div>
          <div style={{ fontSize: 8, letterSpacing: '0.20em', color: 'var(--fg-4)', marginTop: 4 }}>{manifest.workflow_id.slice(-14).toUpperCase()}</div>
        </div>
      </div>

      {/* tear bottom */}
      <div style={{
        height: 8, marginTop: -1,
        background: `radial-gradient(circle at 4px 100%, var(--bg-0) 4px, transparent 4px)`,
        backgroundSize: '8px 8px', backgroundRepeat: 'repeat-x',
        backgroundPosition: '0 top', borderTop: '1px dashed var(--line-3)',
      }} />
    </div>
  );
}

interface RecentRun {
  id: string;
  timestamp: string;
  workflowName: string;
  success: boolean;
  logCount: number;
}

function relTime(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface DrawerProps {
  logs: ExecutionLog[];
  manifest: Manifest | null;
  isRunning: boolean;
  recentRuns?: RecentRun[];
  onSelectRun?: (id: string, timestamp: string) => void;
  selectedRunKey?: string | null;
  activeTab?: 'log' | 'manifest' | 'verify' | 'history';
  onTabChange?: (t: 'log' | 'manifest' | 'verify' | 'history') => void;
}

export function Drawer({ logs, manifest, isRunning, recentRuns = [], onSelectRun, selectedRunKey, activeTab, onTabChange }: DrawerProps) {
  const [localTab, setLocalTab] = useState<'log' | 'manifest' | 'verify' | 'history'>('log');
  const tab = activeTab ?? localTab;
  const setTab = (t: 'log' | 'manifest' | 'verify' | 'history') => { setLocalTab(t); onTabChange?.(t); };
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
          {(['log', 'manifest', 'verify', 'history'] as const).map(t => (
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
          <div className="drawer-main">

            {tab === 'log' && (
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
                          {(l.data?.tee_verified === true || l.data?.result?.tee_verified === true) && (
                            <span style={{ marginLeft: 8, fontSize: 9, letterSpacing: '.12em', background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.28)', color: 'var(--anchor-300)', padding: '1px 6px', borderRadius: 3, verticalAlign: 'middle' }}>TEE ✓</span>
                          )}
                          {(l.data?.tee_verified === false || l.data?.result?.tee_verified === false) && (
                            <span style={{ marginLeft: 8, fontSize: 9, letterSpacing: '.12em', background: 'rgba(244,113,116,.12)', border: '1px solid rgba(244,113,116,.28)', color: 'var(--err-500)', padding: '1px 6px', borderRadius: 3, verticalAlign: 'middle' }}>TEE ✗</span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'manifest' && (
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

            {tab === 'history' && (
              <div style={{ padding: '4px 0' }}>
                {recentRuns.length === 0 ? (
                  <div className="drawer-empty">No runs yet — deploy a workflow.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentRuns.map(run => {
                      const key = run.id + run.timestamp;
                      const isSelected = selectedRunKey === key;
                      return (
                        <div
                          key={key}
                          onClick={() => onSelectRun?.(run.id, run.timestamp)}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.08em', minWidth: 0, cursor: onSelectRun ? 'pointer' : 'default', padding: '4px 8px', borderRadius: 4, background: isSelected ? 'var(--bg-2)' : 'transparent', border: isSelected ? '1px solid var(--line-2)' : '1px solid transparent', transition: 'background 120ms, border-color 120ms' }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)'; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: run.success ? 'var(--ok-500)' : 'var(--err-500)', boxShadow: run.success ? '0 0 5px var(--ok-glow)' : 'none' }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--fg-1)' : 'var(--fg-2)' }}>{run.workflowName}</span>
                          <span style={{ color: 'var(--fg-4)', flexShrink: 0 }}>{relTime(run.timestamp)}</span>
                          <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 3, padding: '1px 5px', color: 'var(--fg-4)', flexShrink: 0 }}>{run.logCount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      )}
    </section>
  );
}
