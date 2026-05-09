'use client';

import { Handle, Position } from 'reactflow';

export function LogicNode({ data }: { data: any }) {
  const status = data.status || 'idle';
  const name = data.name || '0G Compute · Sealed';
  const nodeId = (data.nodeId || 'LX·07') + ' · 0G COMPUTE';
  const sealed = data.sealed !== false;

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
        <div className="title">
          <span className="name">{name}</span>
          <span className="id">{nodeId}</span>
        </div>
        <span className={`status status-${status}`} />
        <Handle type="source" position={Position.Right} id="output" style={{ background: 'var(--bg-3)', border: '2px solid var(--logic-300)', width: 12, height: 12, borderRadius: 9999 }} />
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Model</span>
          <span className="v violet">{data.model || 'qwen2.5-7b'}</span>
        </div>
        <div className="node-row">
          <span className="l">Provider</span>
          <span className="v">0g-compute · galileo</span>
        </div>
        <div className="toggle-row">
          <div className="l">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--logic-300)' }}>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Sealed inference
          </div>
          <span className={`toggle ${sealed ? 'on' : ''}`} />
        </div>
        <div className="node-row">
          <span className="l">Temp</span>
          <span className="v">0.7 · max 512 tok</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">PROOF</span>
        <span className="v">tee · attested</span>
      </div>
    </div>
  );
}
