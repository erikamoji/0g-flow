'use client';

import React, { useState } from 'react';
import { NODE_TYPES, NodeType } from '@/lib/nodeTypes';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/templates';

interface SidebarProps {
  onLoadTemplate?: (t: WorkflowTemplate) => void;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function Sidebar({ onLoadTemplate }: SidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  const dotColor: Record<string, string> = {
    data_input: 'var(--input-400)',
    ai_compute: 'var(--logic-400)',
    storage_anchor: 'var(--anchor-400)',
    memory_store: 'var(--memory-400)',
  };

  return (
    <aside className="sidebar" style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-section">
        <h1 className="brand-wordmark" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>0G Flow</h1>
        <div style={{ height: 2, marginTop: 10, borderRadius: 1, background: 'linear-gradient(90deg, var(--input-300) 0%, var(--logic-300) 50%, var(--anchor-300) 100%)', opacity: 0.5 }} />
        <p className="eyebrow" style={{ marginTop: 8 }}>Visual Agent Builder</p>
      </div>

      <div className="sidebar-section" style={{ flex: paletteOpen ? 1 : 0, overflow: 'auto', minHeight: 0 }}>
        <button onClick={() => setPaletteOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: paletteOpen ? 8 : 0 }}>
          <span className="eyebrow">Node Palette</span>
          <ChevronIcon open={paletteOpen} />
        </button>
        {paletteOpen && <div className="palette-list">
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
              <div key={key} draggable onDragStart={(e) => onDragStart(e, key)} className={`palette-item ${variantClass}`}>
                <div className="icon">{iconSvg}</div>
                <div className="meta">
                  <div className="name">{config.label}</div>
                  <div className="sub">{subId}</div>
                </div>
                <span className="grip" style={{ userSelect: 'none' }}>⋮⋮</span>
              </div>
            );
          })}
        </div>}
      </div>

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--line-2)', flexShrink: 0 }}>
        <button onClick={() => setTemplatesOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: templatesOpen ? 10 : 0 }}>
          <span className="eyebrow">Templates</span>
          <ChevronIcon open={templatesOpen} />
        </button>
        {templatesOpen && <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {WORKFLOW_TEMPLATES.map((t) => (
            <div
              key={t.id}
              onClick={() => { setActiveId(t.id); setTimeout(() => setActiveId(null), 500); onLoadTemplate?.(t); }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', borderRadius: 7, background: activeId === t.id ? 'var(--bg-3)' : 'transparent', border: '1px solid transparent', cursor: 'pointer', transition: 'background 120ms' }}
              onMouseEnter={e => { if (activeId !== t.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)'; }}
              onMouseLeave={e => { if (activeId !== t.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor[t.nodes[0]?.type || ''] || 'var(--fg-4)', flexShrink: 0, marginTop: 4 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-inter-tight, sans-serif)', fontSize: 11, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 9, color: 'var(--fg-4)', marginTop: 2 }}>{t.nodeChain.join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </aside>
  );
}
