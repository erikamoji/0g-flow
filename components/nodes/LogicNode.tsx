'use client';

import { useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useChainId } from 'wagmi';
import { getNetwork } from '@/lib/networks';

export function LogicNode({ id, data }: { id: string; data: any }) {
  const { setNodes, setEdges } = useReactFlow();
  const chainId = useChainId();
  const models = getNetwork(chainId).models;
  const name = data.name || '0G Compute · Sealed';
  const model = data.model || models[0];
  const sealed = data.sealed !== false;
  const instruction = data.instruction || '';

  const [editingName, setEditingName] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(false);

  const update = useCallback((patch: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  useEffect(() => {
    if (!models.includes(data.model)) {
      update({ model: models[0] });
    }
  }, [chainId]);

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
          <select
            className="node-edit-select"
            value={model}
            onChange={e => update({ model: e.target.value })}
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--logic-300)' }}
          >
            {models.map(m => <option key={m} value={m}>{m.split('/').pop()}</option>)}
          </select>
        </div>
        <div className="node-row">
          <span className="l">Provider</span>
          <span className="v">0g-compute · {chainId === 16661 ? 'mainnet' : 'galileo'}</span>
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
