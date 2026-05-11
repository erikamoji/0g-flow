'use client';

import { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const DEFAULT_PAYLOAD = `{
  "event": "manual",
  "payload": { "k": 42 }
}`;

export function InputNode({ id, data }: { id: string; data: any }) {
  const { setNodes } = useReactFlow();
  const status = data.status || 'idle';
  const name = data.name || 'Input · Manual';
  const payload = data.payload || DEFAULT_PAYLOAD;
  const source = data.source || 'manual';

  const [editingName, setEditingName] = useState(false);
  const [editingPayload, setEditingPayload] = useState(false);

  const update = useCallback((patch: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const nodeId = (data.nodeId || 'IN·01') + ' · TRIGGER · ' + source.toUpperCase();

  return (
    <div className={`node node-input ${data.selected ? 'selected' : ''}`} style={{ width: 260 }}>
      <div className="node-head">
        <Handle type="target" position={Position.Left} id="input" style={{ background: 'var(--bg-3)', border: '2px solid var(--input-300)', width: 12, height: 12, borderRadius: 9999 }} />
        <div className="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
            <path d="M12 4v12" />
            <path d="M7 11l5 5 5-5" />
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
        <Handle type="source" position={Position.Right} id="output" style={{ background: 'var(--bg-3)', border: '2px solid var(--input-300)', width: 12, height: 12, borderRadius: 9999 }} />
      </div>
      <div className="node-body">
        {editingPayload ? (
          <textarea
            className="node-edit-textarea"
            defaultValue={payload}
            autoFocus
            onBlur={e => { update({ payload: e.target.value }); setEditingPayload(false); }}
            onKeyDown={e => { if (e.key === 'Escape') { setEditingPayload(false); } }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div
            className="node-pre node-editable"
            title="Click to edit payload"
            onClick={() => setEditingPayload(true)}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {payload}
          </div>
        )}
        <div className="node-row">
          <span className="l">Source</span>
          <select
            className="node-edit-select"
            value={source}
            onChange={e => update({ source: e.target.value })}
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--input-300)' }}
          >
            <option value="manual">manual</option>
            <option value="webhook">webhook</option>
            <option value="cron">cron</option>
          </select>
        </div>
        <div className="node-row">
          <span className="l">Schema</span>
          <span className="v">JSON · 256B max</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">SOURCE</span>
        <span className="v">{source} · /trigger</span>
      </div>
    </div>
  );
}
