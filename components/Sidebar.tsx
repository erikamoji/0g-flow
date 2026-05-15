'use client';

import React from 'react';
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
    <aside className="sidebar" style={{ width: 210, flexShrink: 0 }}>
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
            const variantClass = { data_input: 'input', ai_compute: 'logic', storage_anchor: 'anchor', memory_store: 'memory' }[key] || 'input';
            const subId = { data_input: 'IN · TRIGGER', ai_compute: 'LX · 0G COMPUTE', storage_anchor: 'AN · 0G STORAGE', memory_store: 'MM · 0G MEMORY' }[key] || '';
            const iconSvg = {
              data_input:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>,
              ai_compute:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
              storage_anchor:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M5 14c0 4 3 7 7 7s7-3 7-7M3 14h4M17 14h4"/></svg>,
              memory_store:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M20 12c0 1.4-3.6 2.5-8 2.5S4 13.4 4 12"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/></svg>,
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
                <span className="grip" style={{ userSelect: 'none' }}>⋮⋮</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="eyebrow">Templates</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          {[
            { name: 'DeFi Signal Analyzer', meta: '4 nodes · TEE · memory', active: true },
            { name: 'Verifiable Memory Chat', meta: '5 nodes · sealed', active: false },
            { name: 'Agent Research Loop', meta: '3 nodes · chained', active: false },
          ].map(t => (
            <div key={t.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', borderRadius: 7, background: t.active ? 'var(--logic-bg)' : 'transparent', border: `1px solid ${t.active ? 'var(--logic-ring)' : 'transparent'}`, cursor: 'pointer', transition: 'background 120ms' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.active ? 'var(--logic-300)' : 'var(--fg-4)', flexShrink: 0, marginTop: 4 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-inter-tight, sans-serif)', fontSize: 11, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 9, color: 'var(--fg-4)', marginTop: 2 }}>{t.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

