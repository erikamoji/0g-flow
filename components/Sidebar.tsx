'use client';

import { NODE_TYPES, NodeType } from '@/lib/nodeTypes';

export function Sidebar() {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: NodeType
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <aside className="sidebar" style={{ width: 280 }}>
      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="brand-wordmark" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>0G Flow</h1>
          <span className="hdr-net"><span className="dot" />GALILEO</span>
        </div>
        <p className="eyebrow" style={{ marginTop: 6 }}>Visual Agent Builder</p>
      </div>

      <div className="sidebar-section">
        <div className="eyebrow">Node Palette</div>
        <div className="palette-list">
          {(Object.entries(NODE_TYPES) as Array<[NodeType, any]>).map(([key, config]) => {
            const variantClass = { data_input: 'input', ai_compute: 'logic', storage_anchor: 'anchor' }[key] || 'input';
            const subId = { data_input: 'IN · TRIGGER', ai_compute: 'LX · 0G COMPUTE', storage_anchor: 'AN · 0G STORAGE' }[key] || '';
            const iconSvg = {
              data_input:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/></svg>,
              ai_compute:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>,
              storage_anchor:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>,
            }[key];
            return (
              <div key={key}
                   draggable
                   onDragStart={(e) => onDragStart(e, key)}
                   className={`palette-item ${variantClass}`}>
                <div className="icon">{iconSvg}</div>
                <div className="meta">
                  <div className="name">{config.label}</div>
                  <div className="sub">{subId}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="eyebrow">How It Works</div>
        <ol style={{ marginTop: 12, paddingLeft: 18, color: 'var(--fg-3)', fontSize: 12, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong style={{ color: 'var(--fg-2)' }}>Input</strong> — define the data source</li>
          <li><strong style={{ color: 'var(--fg-2)' }}>Logic</strong> — process with 0G AI compute</li>
          <li><strong style={{ color: 'var(--fg-2)' }}>Anchor</strong> — persist to decentralized storage</li>
        </ol>
      </div>
    </aside>
  );
}

