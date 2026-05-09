'use client';

import { Handle, Position } from 'reactflow';

export function AnchorNode({ data }: { data: any }) {
  const status = data.status || 'idle';
  const name = data.name || '0G Storage · Anchor';
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
        <div className="title">
          <span className="name">{name}</span>
          <span className="id">{nodeId}</span>
        </div>
        <span className={`status status-${status}`} />
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Bucket</span>
          <span className="v emerald">{data.bucket || 'flow / receipts'}</span>
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
