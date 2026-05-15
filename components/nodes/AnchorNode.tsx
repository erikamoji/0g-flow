'use client';

import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

export function AnchorNode({ id, data }: { id: string; data: any }) {
  const { setNodes, setEdges } = useReactFlow();
  const status = data.status || 'idle';
  const name = data.name || '0G Storage · Anchor';
  const bucket = data.bucket || 'flow / receipts';

  const [editingName, setEditingName] = useState(false);
  const [editingBucket, setEditingBucket] = useState(false);

  const update = useCallback((patch: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const nodeId = (data.nodeId || 'AN·02') + ' · 0G STORAGE';

  return (
    <div className={`node node-anchor ${data.selected ? 'selected' : ''}`} style={{ width: 260 }}>
      <div className="node-head">
        <Handle type="target" position={Position.Left} id="input" style={{ background: 'var(--bg-3)', border: '2px solid var(--anchor-300)', width: 12, height: 12, borderRadius: 9999 }} />
        <div className="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
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
          <span className="id">{nodeId}</span>
        </div>
        <span className={`status status-${status}`} />
        <button onClick={e => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(e => e.source !== id && e.target !== id)); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: 'var(--fg-4)', fontSize: 14, lineHeight: 1, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--err-500)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-4)')} title="Delete node">×</button>
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Bucket</span>
          {editingBucket ? (
            <input
              className="node-edit-input"
              defaultValue={bucket}
              autoFocus
              style={{ color: 'var(--anchor-300)', maxWidth: 130 }}
              onBlur={e => { update({ bucket: e.target.value || bucket }); setEditingBucket(false); }}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingBucket(false); }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="v emerald node-editable" title="Click to edit bucket" onClick={() => setEditingBucket(true)}>{bucket}</span>
          )}
        </div>
        <div className="node-row">
          <span className="l">Hash</span>
          <span className="v">keccak256</span>
        </div>
        <div className="node-row">
          <span className="l">Anchor</span>
          <span className="v">on-chain · galileo</span>
        </div>
        <div className="node-row">
          <span className="l">Replicas</span>
          <span className="v">3 / 3 confirmed</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">LAST TX</span>
        <span className="v tx">{data.lastTx || '0x4f3a…b27c'}</span>
      </div>
    </div>
  );
}
