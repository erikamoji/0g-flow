// nodes.jsx — node card primitives for 0G Flow canvas variations.
// Three style modes: 'filled', 'outline', 'glass'.

const NODE_META = {
  input:  { tone: 'input',  label: 'data_input',     name: 'Data Input',    short: 'IN' },
  logic:  { tone: 'logic',  label: 'ai_compute',     name: '0G Compute',    short: 'LX' },
  memory: { tone: 'memory', label: 'memory_store',   name: 'Memory',        short: 'MM' },
  anchor: { tone: 'anchor', label: 'storage_anchor', name: 'Storage Anchor',short: 'AN' },
};

function toneVars(tone) {
  return {
    '--n':  `var(--${tone}-500)`,
    '--n2': `var(--${tone}-300)`,
    '--nbg': `var(--${tone}-bg)`,
    '--nring': `var(--${tone}-ring)`,
  };
}

function NodeIcon({ tone }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (tone === 'input')   return <svg {...common}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
  if (tone === 'logic')   return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>;
  if (tone === 'memory')  return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M20 12c0 1.4-3.6 2.5-8 2.5S4 13.4 4 12"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/></svg>;
  if (tone === 'anchor')  return <svg {...common}><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M5 14c0 4 3 7 7 7s7-3 7-7M3 14h4M17 14h4"/></svg>;
  return null;
}

function StatusDot({ status }) {
  const map = {
    idle:    { c: 'var(--fg-3)', g: 'none' },
    running: { c: 'var(--n)',    g: '0 0 8px 1px var(--n2)' },
    ok:      { c: 'var(--ok)',   g: '0 0 8px 1px rgba(52,211,153,.5)' },
    err:     { c: 'var(--err)',  g: '0 0 8px 1px rgba(244,113,116,.5)' },
  };
  const s = map[status] || map.idle;
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: s.c, boxShadow: s.g, flex: '0 0 auto' }} />;
}

function FieldRow({ k, v, mono = true, tint }) {
  return (
    <div className="nf-row">
      <span className="nf-k">{k}</span>
      <span className="nf-v" style={{ color: tint || 'var(--fg-1)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{v}</span>
    </div>
  );
}

function NodeCard({ tone, title, badges = [], rows = [], status = 'idle', variant = 'filled', density = 'regular', selected = false, footer = null, style }) {
  const meta = NODE_META[tone];
  const cls = [
    'node',
    `node--${variant}`,
    `node--${density}`,
    selected ? 'is-selected' : '',
    status === 'running' ? 'is-running' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls} style={{ ...toneVars(tone), ...style }}>
      <div className="node-handle node-handle--in" />
      <div className="node-handle node-handle--out" />
      <header className="node-hd">
        <span className="node-icon"><NodeIcon tone={tone} /></span>
        <div className="node-hd-text">
          <div className="node-eyebrow">
            <span>{meta.label}</span>
            <span className="node-eyebrow-dot">·</span>
            <span>{meta.short}·{(Math.floor(Math.random()*90)+10)}</span>
          </div>
          <div className="node-title">{title || meta.name}</div>
        </div>
        <StatusDot status={status} />
      </header>
      {badges.length > 0 && (
        <div className="node-badges">
          {badges.map((b, i) => (
            <span key={i} className={`node-badge${b.tone ? ' node-badge--' + b.tone : ''}`}>
              {b.icon && <span className="node-badge-icon">{b.icon}</span>}
              {b.label}
            </span>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="node-body">
          {rows.map((r, i) => <FieldRow key={i} {...r} />)}
        </div>
      )}
      {footer}
    </div>
  );
}

window.NodeCard = NodeCard;
window.NODE_META = NODE_META;
window.StatusDot = StatusDot;
window.NodeIcon = NodeIcon;
