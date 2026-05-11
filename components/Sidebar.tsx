'use client';

import { NODE_TYPES, NodeType } from '@/lib/nodeTypes';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

interface SidebarProps {
  nodeCount?: number;
  edgeCount?: number;
}

export function Sidebar({ nodeCount = 0, edgeCount = 0 }: SidebarProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: NodeType
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <aside className="sidebar" style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h1 className="brand-wordmark" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>0G Flow</h1>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '3px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {nodeCount}N · {edgeCount}E
          </span>
        </div>
        <div style={{ height: 2, marginTop: 10, borderRadius: 1, background: 'linear-gradient(90deg, var(--input-300) 0%, var(--logic-300) 50%, var(--anchor-300) 100%)', opacity: 0.5 }} />
        <p className="eyebrow" style={{ marginTop: 8 }}>Visual Agent Builder</p>
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
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

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--line-2)', flexShrink: 0, flex: 'none' }}>
        <ConnectButton.Custom>
          {({ account, chain: rkChain, openConnectModal, mounted }) => {
            if (!mounted) return null;
            if (!account) return (
              <button onClick={openConnectModal} style={{ width: '100%', fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-2)', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>
                Connect wallet
              </button>
            );
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {/* Row 1: address + disconnect */}
                <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderLeft: '2px solid var(--ok-500)', color: 'var(--fg-1)', padding: '6px 10px 6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok-500)', boxShadow: '0 0 8px var(--ok-glow)', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.displayName}</span>
                  <button onClick={() => disconnect()} title="Disconnect" style={{ background: 'none', border: 'none', color: 'var(--fg-4)', cursor: 'pointer', padding: 0, lineHeight: 0, borderRadius: 3, flexShrink: 0, transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--err-500)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-4)')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </aside>
  );
}

