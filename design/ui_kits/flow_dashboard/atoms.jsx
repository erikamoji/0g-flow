/* global React */
const { useState } = React;

// ---------- Inline icons (1.5px stroke, 24x24, currentColor) ----------
const ic = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html: d}}/>
);
const Icons = {
  input:    () => ic(`<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 12h4M19 10l2 2-2 2"/><path d="M7 10h6M7 14h4"/>`),
  logic:    () => ic(`<circle cx="12" cy="12" r="4"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3"/><path d="M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>`),
  anchor:   () => ic(`<path d="M12 4v16"/><circle cx="12" cy="6" r="2"/><path d="M5 13c0 4 3 7 7 7s7-3 7-7"/><path d="M3 13h4M17 13h4"/>`),
  play:     () => ic(`<path d="M7 5l12 7-12 7V5z"/>`),
  deploy:   () => ic(`<path d="M5 12l7-7 7 7"/><path d="M12 5v14"/>`),
  wallet:   () => ic(`<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1.25" fill="currentColor"/>`),
  search:   () => ic(`<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>`),
  copy:     () => ic(`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`),
  link:     () => ic(`<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>`),
  gear:     () => ic(`<circle cx="12" cy="12" r="3"/><path d="M19 14a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.8h0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
  plus:     () => ic(`<path d="M12 5v14M5 12h14"/>`),
  minus:    () => ic(`<path d="M5 12h14"/>`),
  maximize: () => ic(`<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>`),
  terminal: () => ic(`<path d="M4 6l5 6-5 6"/><path d="M12 18h8"/><rect x="2" y="3" width="20" height="18" rx="2"/>`),
  lock:     () => ic(`<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`),
  database: () => ic(`<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>`),
  zap:      () => ic(`<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>`),
  chevron:  () => ic(`<path d="M6 9l6 6 6-6"/>`),
  json:     () => ic(`<path d="M8 4c-2 0-3 1-3 3v2c0 1-1 2-2 2v2c1 0 2 1 2 2v2c0 2 1 3 3 3"/><path d="M16 4c2 0 3 1 3 3v2c0 1 1 2 2 2v2c-1 0-2 1-2 2v2c0 2-1 3-3 3"/>`),
};

// ---------- Atoms ----------
const Eyebrow = ({ children, style }) =>
  <span className="eyebrow" style={style}>{children}</span>;

const StatusDot = ({ status = "ok" }) =>
  <span className={`node-head ${''}`}><span className={`status status-${status}`}/></span>;

const Pill = ({ tone = "default", children }) => {
  const tones = {
    default: { color: 'var(--fg-2)', bg: 'var(--bg-2)', bd: 'var(--line-2)' },
    input:   { color: 'var(--input-300)', bg: 'rgba(42,123,255,0.10)', bd: 'rgba(111,177,255,0.30)' },
    logic:   { color: 'var(--logic-300)', bg: 'rgba(124,92,255,0.12)', bd: 'rgba(180,154,255,0.30)' },
    anchor:  { color: 'var(--anchor-300)', bg: 'rgba(16,185,129,0.12)', bd: 'rgba(93,227,165,0.30)' },
    ok:      { color: 'var(--ok-500)', bg: 'rgba(52,211,153,0.10)', bd: 'rgba(52,211,153,0.30)' },
    idle:    { color: 'var(--idle-500)', bg: 'rgba(245,181,68,0.10)', bd: 'rgba(245,181,68,0.30)' },
  };
  const t = tones[tone] || tones.default;
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 8px', borderRadius: 999, font: 'var(--t-eyebrow)',
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: t.color, background: t.bg, border: `1px solid ${t.bd}`,
  }}>{children}</span>;
};

const Toggle = ({ on, onChange, children }) => (
  <div className="toggle-row" onClick={() => onChange(!on)}>
    <span className="l"><Icons.lock/>{children}</span>
    <span className={`toggle ${on ? 'on' : ''}`}/>
  </div>
);

const TxChip = ({ hash, onCopy }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '4px 8px', borderRadius: 6, background: 'var(--bg-2)',
    border: '1px solid var(--line-2)', font: 'var(--t-num)', color: 'var(--input-300)',
  }}>
    <span style={{ font: 'var(--t-eyebrow)', letterSpacing: '0.14em', color: 'var(--fg-3)' }}>TX</span>
    {hash}
    <span style={{ width: 12, height: 12, color: 'var(--fg-3)', cursor: 'pointer' }} onClick={onCopy}><Icons.copy/></span>
  </span>
);

Object.assign(window, { Icons, Eyebrow, StatusDot, Pill, Toggle, TxChip });
