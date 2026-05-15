'use client';

import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

export function MemoryNode({ id, data }: { id: string; data: any }) {
  const { setNodes, setEdges } = useReactFlow();
  const name = data.name || '0G Memory · Store';
  const mode = data.mode || 'write';
  const memKey = data.memKey || 'agent_memory';
  const rootHash = data.rootHash || '';

  const [editingName, setEditingName] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [editingHash, setEditingHash] = useState(false);

  const update = useCallback((patch: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const nodeId = (data.nodeId || 'MX·01') + ' · 0G MEMORY';

  return (
    <div className={`node node-memory ${data.selected ? 'selected' : ''}`} style={{ width: 260 }}>
      <div className="node-head">
        <Handle type="target" position={Position.Left} id="input" style={{ background: 'var(--bg-3)', border: '2px solid var(--memory-300)', width: 12, height: 12, borderRadius: 9999 }} />
        <div className="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 5.58 2 10c0 2.47 1.33 4.67 3.41 6.12L4 22l4.5-2.5C9.6 19.82 10.77 20 12 20c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            <path d="M8 10h8M8 13h5"/>
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
        <button onClick={e => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(e => e.source !== id && e.target !== id)); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: 'var(--fg-4)', fontSize: 14, lineHeight: 1, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--err-500)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-4)')} title="Delete node">×</button>
        <Handle type="source" position={Position.Right} id="output" style={{ background: 'var(--bg-3)', border: '2px solid var(--memory-300)', width: 12, height: 12, borderRadius: 9999 }} />
      </div>
      <div className="node-body">
        <div
          className="toggle-row"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={e => { e.stopPropagation(); update({ mode: mode === 'write' ? 'read' : 'write' }); }}
        >
          <div className="l" style={{ color: 'var(--memory-300)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--memory-300)' }}>
              {mode === 'write'
                ? <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
            {mode === 'write' ? 'Write memory' : 'Read memory'}
          </div>
          <span className={`toggle ${mode === 'write' ? 'on' : ''}`} style={{ '--toggle-on-bg': 'var(--memory-500)', '--toggle-on-bg-alpha': 'rgba(111,204,58,0.20)', '--toggle-on-border': 'rgba(182,255,143,0.35)', '--toggle-on-glow': 'var(--memory-glow)' } as any} />
        </div>

        {mode === 'write' ? (
          <>
            <div className="node-row">
              <span className="l">Key</span>
              {editingKey ? (
                <input
                  className="node-edit-input"
                  defaultValue={memKey}
                  autoFocus
                  style={{ color: 'var(--memory-300)', maxWidth: 130 }}
                  onBlur={e => { update({ memKey: e.target.value || memKey }); setEditingKey(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingKey(false); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="v node-editable" title="Click to edit key" style={{ color: 'var(--memory-300)' }} onClick={() => setEditingKey(true)}>{memKey}</span>
              )}
            </div>
            <div className="node-row">
              <span className="l">Payload</span>
              <span className="v">from upstream</span>
            </div>
            <div className="node-row">
              <span className="l">Replicas</span>
              <span className="v">3 · standard</span>
            </div>
          </>
        ) : (
          <>
            <div className="node-row">
              <span className="l">Root hash</span>
              {editingHash ? (
                <input
                  className="node-edit-input"
                  defaultValue={rootHash}
                  autoFocus
                  placeholder="0x…"
                  style={{ color: 'var(--memory-300)', maxWidth: 130 }}
                  onBlur={e => { update({ rootHash: e.target.value }); setEditingHash(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingHash(false); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="v node-editable" title="Click to set root hash" style={{ color: rootHash ? 'var(--memory-300)' : 'var(--fg-4)', fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11 }} onClick={() => setEditingHash(true)}>
                  {rootHash ? rootHash.slice(0, 10) + '…' : 'click to set…'}
                </span>
              )}
            </div>
            <div className="node-row">
              <span className="l">Inject as</span>
              <span className="v" style={{ color: 'var(--memory-300)' }}>output</span>
            </div>
            <div className="node-row">
              <span className="l">Network</span>
              <span className="v">galileo · turbo</span>
            </div>
          </>
        )}
      </div>
      <div className="node-foot">
        <span className="meta">{mode === 'write' ? 'QUEUE' : 'FETCH'}</span>
        <span className="v">{mode === 'write' ? 'wallet · sign' : 'indexer · rest'}</span>
      </div>
    </div>
  );
}
