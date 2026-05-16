'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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


const VerifyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
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

      <div className="sidebar-section" style={{ flex: paletteOpen ? 1 : '0 0 auto', overflow: paletteOpen ? 'auto' : 'hidden', minHeight: 0 }}>
        <button onClick={() => setPaletteOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: paletteOpen ? 8 : 0 }}>
          <span className="eyebrow">Node Palette</span>
          <ChevronIcon open={paletteOpen} />
        </button>
        {paletteOpen && <div className="palette-list">
          {(Object.entries(NODE_TYPES) as Array<[NodeType, any]>).map(([key, config]) => {
            const variantClass = { data_input: 'input', ai_compute: 'logic', storage_anchor: 'anchor', memory_store: 'memory' }[key] || 'input';
            const subId = { data_input: 'IN · TRIGGER', ai_compute: 'LX · 0G COMPUTE', storage_anchor: 'AN · 0G STORAGE', memory_store: 'MM · 0G MEMORY' }[key] || '';
            const iconSvg = {
              data_input:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/></svg>,
              ai_compute:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3"/><path d="M15 2v3"/><path d="M9 19v3"/><path d="M15 19v3"/><path d="M2 9h3"/><path d="M2 15h3"/><path d="M19 9h3"/><path d="M19 15h3"/></svg>,
              storage_anchor:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>,
              memory_store:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.47 1.33 4.67 3.41 6.12L4 22l4.5-2.5C9.6 19.82 10.77 20 12 20c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/><path d="M8 10h8M8 13h5"/></svg>,
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

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--line-2)', flex: '0 0 auto' }}>
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
          <Link
            href="/verify"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
              padding: '5px 8px', borderRadius: 6, textDecoration: 'none',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--fg-4)', transition: 'background 120ms, color 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--anchor-bg)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--anchor-300)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg-4)'; }}
          >
            <VerifyIcon />
            Verify on-chain
          </Link>
        </div>}
      </div>
    </aside>
  );
}
