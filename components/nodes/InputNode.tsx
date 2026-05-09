'use client';

import { Handle, Position } from 'reactflow';

export function InputNode({ data }: { data: any }) {
  const status = data.status || 'idle';
  const name = data.name || 'Input · Manual';
  const nodeId = (data.nodeId || 'IN·01') + ' · TRIGGER · MANUAL';

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
        <div className="title">
          <span className="name">{name}</span>
          <span className="id">{nodeId}</span>
        </div>
        <span className={`status status-${status}`} />
        <Handle type="source" position={Position.Right} id="output" style={{ background: 'var(--bg-3)', border: '2px solid var(--input-300)', width: 12, height: 12, borderRadius: 9999 }} />
      </div>
      <div className="node-body">
        <div className="node-pre">
          {`{
  `}
          <span className="key">"event"</span>
          {`: `}
          <span className="str">"manual"</span>
          {`,
  `}
          <span className="key">"payload"</span>
          {`: { `}
          <span className="key">"k"</span>
          {`: `}
          <span className="num">42</span>
          {` }
}`}
        </div>
        <div className="node-row">
          <span className="l">Schema</span>
          <span className="v">JSON · 256B max</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">SOURCE</span>
        <span className="v">webhook · /trigger</span>
      </div>
    </div>
  );
}
