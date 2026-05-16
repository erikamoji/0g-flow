'use client';

import React, { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getWorkflow, getLatestExecution } from '@/lib/registry';

const CHAIN_NAMES: Record<number, string> = {
  16600: '0G TESTNET',
  16602: '0G GALILEO',
  16661: '0G ARISTOTLE',
};

interface VerifyResult {
  manifestHash: string;
  storageKey: string;
  createdAt: number;
  executionCount: number;
  execTxHash: string;
  execStorageTx: string;
  execTimestamp: number;
}

function ResultRow({ label, value, link }: { label: string; value: string; link?: string }) {
  const display = value.length > 40 ? value.slice(0, 20) + '…' + value.slice(-8) : value;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '130px 1fr',
      gap: '0 16px', padding: '6px 16px',
      borderBottom: '1px solid var(--line-1)',
      fontFamily: 'var(--font-jetbrains-mono, monospace)',
      fontSize: 11, alignItems: 'baseline',
    }}>
      <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--input-300)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >{display}</a>
      ) : (
        <span style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
      )}
    </div>
  );
}

export default function VerifyPage() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [workflowId, setWorkflowId] = useState('');
  const [ownerAddr, setOwnerAddr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    const owner = ownerAddr.trim() || address || '';
    if (!owner) { setError('Connect wallet or enter owner address'); return; }
    if (!workflowId.trim()) { setError('Enter a workflow ID'); return; }
    setVerifying(true); setError(''); setResult(null);
    try {
      const [wf, ex] = await Promise.all([
        getWorkflow(owner, workflowId.trim(), chainId),
        getLatestExecution(owner, workflowId.trim(), chainId),
      ]);
      setResult({
        manifestHash: wf.manifestHash,
        storageKey: wf.storageKey,
        createdAt: wf.createdAt,
        executionCount: wf.executionCount,
        execTxHash: ex.executionTxHash,
        execStorageTx: ex.storageTxHash,
        execTimestamp: ex.timestamp,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
    } finally {
      setVerifying(false);
    }
  };

  const canVerify = !!workflowId.trim() && !verifying;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-0)',
      color: 'var(--fg-1)',
      fontFamily: 'var(--font-inter-tight, sans-serif)',
      WebkitFontSmoothing: 'antialiased',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 0)',
      backgroundSize: '22px 22px',
    }}>

      {/* Header */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        background: 'rgba(22,26,34,0.88)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line-2)',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--fg-3)', textDecoration: 'none',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', transition: 'color 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-3)')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Canvas
          </Link>
          <span style={{ color: 'var(--line-3)', fontSize: 13 }}>/</span>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
            background: 'var(--brand-grad)', WebkitBackgroundClip: 'text',
            backgroundClip: 'text', color: 'transparent',
          }}>Verify</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
            fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--fg-4)', background: 'var(--bg-2)', border: '1px solid var(--line-2)',
            borderRadius: 20, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok-500)', boxShadow: '0 0 6px var(--ok-glow)', display: 'inline-block', flexShrink: 0 }} />
            {CHAIN_NAMES[chainId] || `CHAIN ${chainId}`}
          </span>
          <ConnectButton.Custom>
            {({ account, openConnectModal, openAccountModal, mounted }) => {
              if (!mounted) return null;
              if (!account) return (
                <button onClick={openConnectModal} style={{
                  fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.10em', textTransform: 'uppercase', height: 30, padding: '0 12px',
                  background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-2)',
                  borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>Connect wallet</button>
              );
              return (
                <div onClick={openAccountModal} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.10em', textTransform: 'uppercase', height: 30, padding: '0 10px',
                  background: 'var(--bg-2)', border: '1px solid var(--line-2)',
                  borderLeft: '2px solid var(--ok-500)',
                  color: 'var(--fg-1)', borderRadius: 6, cursor: 'pointer',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok-500)', boxShadow: '0 0 6px var(--ok-glow)', flexShrink: 0 }} />
                  {account.displayName}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '72px 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Page title */}
          <div style={{ marginBottom: 40 }}>
            <span style={{
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: 'var(--fg-4)', display: 'block', marginBottom: 12,
            }}>03 · Verify</span>
            <h1 style={{
              fontFamily: 'var(--font-display, serif)',
              fontSize: 38, fontWeight: 500, lineHeight: 1.08,
              letterSpacing: '-0.02em', margin: '0 0 14px',
              background: 'var(--brand-grad)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>On-chain lookup</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0, maxWidth: 460 }}>
              Every workflow anchored through 0G Flow leaves a permanent record.
              Enter an owner address and workflow ID to retrieve it.
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line-2)',
            borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '4px 16px 3px', background: 'var(--bg-2)',
              borderBottom: '1px solid var(--line-1)',
            }}>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-4)',
              }}>Workflow lookup</span>
            </div>

            <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-4)',
                  }}>Owner Address</label>
                  <input
                    value={ownerAddr}
                    onChange={e => setOwnerAddr(e.target.value)}
                    placeholder={address || '0x…'}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500,
                      background: 'var(--bg-0)', border: '1px solid var(--line-2)', color: 'var(--fg-1)',
                      borderRadius: 6, padding: '7px 10px', outline: 'none', width: '100%',
                      boxSizing: 'border-box', letterSpacing: '0.04em', transition: 'border-color 120ms',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--input-500)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                  />
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-4)',
                  }}>Workflow ID</label>
                  <input
                    value={workflowId}
                    onChange={e => setWorkflowId(e.target.value)}
                    placeholder="wf-…"
                    onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500,
                      background: 'var(--bg-0)', border: '1px solid var(--line-2)', color: 'var(--fg-1)',
                      borderRadius: 6, padding: '7px 10px', outline: 'none', width: '100%',
                      boxSizing: 'border-box', letterSpacing: '0.04em', transition: 'border-color 120ms',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--anchor-500)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleVerify}
                  disabled={!canVerify}
                  style={{
                    background: canVerify ? 'var(--brand-grad)' : 'var(--bg-3)',
                    border: 0, borderRadius: 7,
                    color: canVerify ? '#07090C' : 'var(--fg-4)',
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
                    padding: '0 20px', height: 34,
                    cursor: canVerify ? 'pointer' : 'not-allowed',
                    opacity: canVerify ? 1 : 0.5,
                    transition: 'opacity 120ms, filter 120ms',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { if (canVerify) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
                >
                  {verifying ? (
                    <>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#07090C',
                        animation: 'spin 0.9s linear infinite', display: 'inline-block', flexShrink: 0,
                      }} />
                      Looking up…
                    </>
                  ) : 'Verify →'}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12,
              fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11,
              color: 'var(--err-500)', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{
              marginTop: 20,
              background: 'var(--bg-1)', border: '1px solid var(--line-2)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 40px -20px rgba(52,211,153,0.15)',
            }}>
              <div style={{
                padding: '4px 16px 3px', background: 'var(--bg-2)',
                borderBottom: '1px solid var(--line-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-4)',
                }}>On-chain Record</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--anchor-300)',
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--anchor-300)', boxShadow: '0 0 6px var(--anchor-glow)', display: 'inline-block' }} />
                  Anchored
                </span>
              </div>
              <div style={{ paddingBottom: 4 }}>
                <ResultRow label="Manifest Hash" value={result.manifestHash} />
                <ResultRow label="Storage Key" value={result.storageKey} />
                <ResultRow label="Created" value={result.createdAt ? new Date(result.createdAt * 1000).toLocaleString() : '—'} />
                <ResultRow label="Executions" value={String(result.executionCount)} />
                {result.execTimestamp > 0 && (
                  <>
                    <ResultRow
                      label="Latest Exec Tx"
                      value={result.execTxHash}
                      link={`https://explorer.0g.ai/tx/${result.execTxHash}`}
                    />
                    <ResultRow label="Storage Tx" value={result.execStorageTx} />
                    <ResultRow label="Exec Time" value={new Date(result.execTimestamp * 1000).toLocaleString()} />
                  </>
                )}
              </div>
            </div>
          )}

          <p style={{
            marginTop: 32,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
            fontSize: 10, letterSpacing: '0.10em', color: 'var(--fg-4)', textAlign: 'center',
          }}>
            Reads directly from {CHAIN_NAMES[chainId] || `chain ${chainId}`} · no intermediary
          </p>
        </div>
      </main>
    </div>
  );
}
