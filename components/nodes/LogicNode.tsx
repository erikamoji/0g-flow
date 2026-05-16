'use client';

import { useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useChainId } from 'wagmi';
import { getNetwork } from '@/lib/networks';

type ProviderEntry = {
  provider: string;
  model: string;
  url: string;
  uptime: number | null;
  avgResponseTime: number | null;
  teeAcknowledged: boolean;
};

export function LogicNode({ id, data }: { id: string; data: any }) {
  const { setNodes, setEdges } = useReactFlow();
  const chainId = useChainId();
  const fallbackModels = getNetwork(chainId).models;

  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const name = data.name || '0G Compute · Sealed';
  const sealed = data.sealed !== false;
  const instruction = data.instruction || '';

  const [editingName, setEditingName] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(false);

  const update = useCallback((patch: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  useEffect(() => {
    setLoadingProviders(true);
    fetch(`/api/providers?chainId=${chainId}`)
      .then(r => r.json())
      .then((list: ProviderEntry[]) => {
        if (!Array.isArray(list) || list.length === 0) return;
        setProviders(list);
        const current = list.find(p => p.provider === data.provider_address);
        if (!current) {
          update({ model: list[0].model, provider_address: list[0].provider });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProviders(false));
  }, [chainId]);

  const selectedProvider = providers.find(p => p.provider === data.provider_address);
  const model = selectedProvider?.model || data.model || fallbackModels[0] || '';

  return (
    <div className={`node node-logic ${data.selected ? 'selected' : ''}`} style={{ width: 260 }}>
      <div className="node-head">
        <Handle type="target" position={Position.Left} id="input" style={{ background: 'var(--bg-3)', border: '2px solid var(--logic-300)', width: 12, height: 12, borderRadius: 9999 }} />
        <div className="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="6" width="12" height="12" rx="1" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 2v3" />
            <path d="M15 2v3" />
            <path d="M9 19v3" />
            <path d="M15 19v3" />
            <path d="M2 9h3" />
            <path d="M2 15h3" />
            <path d="M19 9h3" />
            <path d="M19 15h3" />
          </svg>
        </div>
        <div className="title" style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              className="node-edit-name"
              defaultValue={name}
              autoFocus
              onBlur={e => { update({ name: e.target.value || name }); setEditingName(false); }}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingName(false); }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="name node-editable" title="Double-click to rename" onDoubleClick={() => setEditingName(true)}>{name}</span>
          )}

        </div>
        <button onClick={e => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(e => e.source !== id && e.target !== id)); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: 'var(--fg-4)', fontSize: 14, lineHeight: 1, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--err-500)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-4)')} title="Delete node">×</button>
        <Handle type="source" position={Position.Right} id="output" style={{ background: 'var(--bg-3)', border: '2px solid var(--logic-300)', width: 12, height: 12, borderRadius: 9999 }} />
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Model</span>
          {loadingProviders ? (
            <span className="v" style={{ color: 'var(--fg-4)' }}>loading…</span>
          ) : providers.length > 0 ? (
            <select
              className="node-edit-select"
              value={data.provider_address || ''}
              onChange={e => {
                const p = providers.find(p => p.provider === e.target.value);
                if (p) update({ model: p.model, provider_address: p.provider });
              }}
              onClick={e => e.stopPropagation()}
              style={{ color: 'var(--logic-300)' }}
            >
              {providers.map(p => (
                <option key={p.provider} value={p.provider}>
                  {p.model.split('/').pop()}{p.uptime != null ? ` · ${p.uptime.toFixed(0)}%` : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="v" style={{ color: 'var(--err-500)' }}>no providers</span>
          )}
        </div>
        <div className="node-row">
          <span className="l">Provider</span>
          <span className="v" style={{ fontFamily: 'monospace', fontSize: 10 }}>
            {selectedProvider
              ? `${selectedProvider.provider.slice(0, 6)}…${selectedProvider.provider.slice(-4)}`
              : `0g · ${chainId === 16661 ? 'mainnet' : 'galileo'}`}
          </span>
        </div>
        <div
          className="toggle-row"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={e => { e.stopPropagation(); update({ sealed: !sealed }); }}
        >
          <div className="l">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--logic-300)' }}>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Sealed inference
          </div>
          <span className={`toggle ${sealed ? 'on' : ''}`} />
        </div>
        {editingInstruction ? (
          <textarea
            className="node-edit-textarea"
            defaultValue={instruction}
            placeholder="System instruction…"
            autoFocus
            rows={3}
            onBlur={e => { update({ instruction: e.target.value }); setEditingInstruction(false); }}
            onKeyDown={e => { if (e.key === 'Escape') setEditingInstruction(false); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div
            className="node-pre node-editable"
            title="Click to edit instruction"
            onClick={() => setEditingInstruction(true)}
            style={{ fontSize: 11, color: instruction ? 'var(--fg-2)' : 'var(--fg-4)', minHeight: 36 }}
          >
            {instruction || 'click to add instruction…'}
          </div>
        )}
        <div className="node-row">
          <span className="l">Temp</span>
          <span className="v">0.7 · max 512 tok</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">PROOF</span>
        <span className="v">tee · {sealed ? 'attested' : 'unverified'}</span>
      </div>
    </div>
  );
}
