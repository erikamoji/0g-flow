// workflow-canvas.jsx — the canvas screen with sidebar palette + workflow + bottom log.

const PALETTE = [
  { tone: 'input',  label: 'Data Input',    desc: 'Manual / API trigger' },
  { tone: 'logic',  label: '0G Compute',    desc: 'Sealed inference' },
  { tone: 'memory', label: 'Memory',        desc: 'Read / write context' },
  { tone: 'anchor', label: 'Storage Anchor',desc: 'Anchor + on-chain' },
];

function PaletteItem({ tone, label, desc, variant, density }) {
  return (
    <div className={`palette-item palette-item--${variant} palette-item--${density}`} style={toneVars(tone)} draggable>
      <span className="palette-icon"><NodeIcon tone={tone} /></span>
      <div className="palette-text">
        <div className="palette-label">{label}</div>
        <div className="palette-desc">{desc}</div>
      </div>
      <span className="palette-grip">⋮⋮</span>
    </div>
  );
}

function toneVars(tone) {
  return {
    '--n':  `var(--${tone}-500)`,
    '--n2': `var(--${tone}-300)`,
    '--nbg': `var(--${tone}-bg)`,
    '--nring': `var(--${tone}-ring)`,
  };
}

// ───────────── workflow scene ─────────────

// Positions for the 4-node DeFi Signal Analyzer workflow.
// Tuned for a ~720×460 plot area inside the artboard's canvas region.
const SCENE = {
  nodes: [
    { id: 'n1', tone: 'input',  x:  20, y:  60, status: 'ok',
      title: 'ETH/USDC · Market Feed',
      badges: [{ label: 'manual', tone: 'n' }, { label: 'JSON', tone: 'n' }],
      rows: [
        { k: 'source',  v: 'cmc·spot' },
        { k: 'window',  v: '24h' },
        { k: 'payload', v: '{ pair, ohlc, vol }', tint: 'var(--n2)' },
      ],
    },
    { id: 'n2', tone: 'logic', x: 290, y:  20, status: 'running',
      title: 'Signal · Trend Reasoner',
      badges: [{ label: 'TEE', tone: 'ok' }, { label: 'sealed', tone: 'n' }],
      rows: [
        { k: 'model',  v: 'qwen3-vl-30b' },
        { k: 'router', v: 'router-api.0g.ai' },
        { k: 'prompt', v: 'Score risk + trend on {{n1.output}}', tint: 'var(--n2)' },
        { k: 'tee',    v: 'verify_tee: true', tint: 'var(--ok)' },
      ],
    },
    { id: 'n3', tone: 'memory', x: 290, y: 320, status: 'idle',
      title: 'Memory · signal/eth-usdc',
      badges: [{ label: 'read', tone: 'n' }, { label: '0G Storage', tone: 'n' }],
      rows: [
        { k: 'mode',     v: 'read' },
        { k: 'mem_key',  v: 'sig/eth-usdc/7d' },
        { k: 'root',     v: '0x8fa2…e31d ↗', tint: 'var(--n2)' },
      ],
    },
    { id: 'n4', tone: 'anchor', x: 590, y: 170, status: 'idle',
      title: 'Anchor · signal-receipt',
      badges: [{ label: 'WorkflowRegistry', tone: 'n' }, { label: 'mainnet', tone: 'ok' }],
      rows: [
        { k: 'bucket',    v: 'signals/2026' },
        { k: 'on_chain',  v: 'recordExecution', tint: 'var(--n2)' },
        { k: 'tx',        v: 'pending…', tint: 'var(--fg-3)' },
      ],
    },
  ],
  edges: [
    { from: 'n1', to: 'n2', live: true },
    { from: 'n1', to: 'n3', live: false },
    { from: 'n3', to: 'n2', live: false },
    { from: 'n2', to: 'n4', live: false },
  ],
};

// Per-density layout multipliers
const DENSITY = {
  compact: { nodeW: 230, headerH: 60, padX: 22, plotH: 460 },
  regular: { nodeW: 250, headerH: 64, padX: 26, plotH: 460 },
  roomy:   { nodeW: 270, headerH: 72, padX: 30, plotH: 480 },
};

function Edge({ from, to, live, variant, nodesById }) {
  const a = nodesById[from], b = nodesById[to];
  if (!a || !b) return null;
  const x1 = a.x + 250, y1 = a.y + 40;
  const x2 = b.x,       y2 = b.y + 40;
  const mx = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  const tone = a.tone;
  const color = `var(--${tone}-500)`;
  const c2 = `var(--${b.tone}-500)`;
  return (
    <g>
      <defs>
        <linearGradient id={`g-${from}-${to}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor={color} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d={d} stroke={`url(#g-${from}-${to})`} strokeWidth={live ? 1.75 : 1.25} fill="none" opacity={live ? 0.9 : 0.35}
            strokeDasharray={live ? '6 4' : 'none'}
            style={live ? { animation: 'edge-march 1.4s linear infinite' } : null} />
      {live && (
        <circle r="2.5" fill={color}>
          <animateMotion dur="1.6s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

function CanvasScene({ variant, density }) {
  const nodesById = Object.fromEntries(SCENE.nodes.map(n => [n.id, n]));
  return (
    <div className="cv-scene">
      <svg className="cv-edges" width="100%" height="100%" viewBox="0 0 820 460" preserveAspectRatio="none">
        {SCENE.edges.map(e => <Edge key={`${e.from}-${e.to}`} {...e} variant={variant} nodesById={nodesById} />)}
      </svg>
      {SCENE.nodes.map(n => (
        <div key={n.id} className="cv-node-slot" style={{ left: n.x, top: n.y }}>
          <NodeCard tone={n.tone} title={n.title} badges={n.badges} rows={n.rows}
                    status={n.status} variant={variant} density={density}
                    selected={n.id === 'n2'} />
        </div>
      ))}
      <div className="cv-grid" />
    </div>
  );
}

// ───────────── log / terminal ─────────────

const LOG_LINES = [
  { t: '00:00.000', kind: 'sys', text: 'manifest compiled · workflow_id=wf-7k2m-9xab' },
  { t: '00:00.041', kind: 'sys', text: 'registerWorkflow → 0G Chain · 0x4f3a…b27c ↗' },
  { t: '00:00.612', kind: 'in',  text: 'data_input · IN·47 → emit { pair: ETH/USDC, … }' },
  { t: '00:00.704', kind: 'mem', text: 'memory_store · MM·12 → read sig/eth-usdc/7d' },
  { t: '00:01.221', kind: 'lo',  text: 'ai_compute · LX·08 → router-api.0g.ai · sealed=true' },
  { t: '00:01.851', kind: 'ok',  text: 'TEE ✓ · tee_verified · provider 0x4f3a…' },
  { t: '00:02.014', kind: 'lo',  text: 'inference complete · 142 tok · score=0.71 trend=up' },
  { t: '00:02.118', kind: 'an',  text: 'storage_anchor · uploading → 0G Storage…' },
];

function ExecLog({ variant }) {
  return (
    <div className={`cv-log cv-log--${variant}`}>
      <div className="cv-log-bar">
        <span className="cv-log-dot" style={{ background: '#FF5F57' }} />
        <span className="cv-log-dot" style={{ background: '#FFBD2E' }} />
        <span className="cv-log-dot" style={{ background: '#28C840' }} />
        <span className="cv-log-label">execute · wf-7k2m-9xab</span>
        <span className="cv-log-tabs">
          <span className="is-active">log</span>
          <span>manifest</span>
          <span>verify</span>
          <span>history</span>
        </span>
        <span className="cv-log-right">
          <span className="cv-pulse" /> live · galileo
        </span>
      </div>
      <div className="cv-log-body">
        {LOG_LINES.map((l, i) => (
          <div key={i} className={`cv-log-line cv-log-line--${l.kind}`}>
            <span className="cv-log-t">{l.t}</span>
            <span className="cv-log-glyph">{l.kind === 'ok' ? '✓' : l.kind === 'err' ? '✗' : l.kind === 'sys' ? '◦' : '◆'}</span>
            <span className="cv-log-text">{l.text}</span>
          </div>
        ))}
        <div className="cv-log-line cv-log-line--caret">
          <span className="cv-log-t">00:02.4</span>
          <span className="cv-log-glyph">▸</span>
          <span className="cv-log-text">awaiting tx receipt<span className="cv-caret">_</span></span>
        </div>
      </div>
    </div>
  );
}

// ───────────── full workflow canvas screen ─────────────

function WorkflowCanvas({ variant = 'filled', density = 'regular', title = 'A · Neon Terminal', subtitle = 'Filled cards · accent glow' }) {
  return (
    <div className={`cv cv--${variant} cv--${density}`}>
      <header className="cv-topbar">
        <div className="cv-topbar-l">
          <div className="cv-brand">
            <span className="cv-brand-mark" />
            <span className="cv-brand-name">0G Flow</span>
            <span className="cv-brand-slash">/</span>
            <span className="cv-brand-wf">defi-signal-analyzer</span>
          </div>
        </div>
        <div className="cv-topbar-c">
          <span className="cv-chip"><span className="cv-pulse cv-pulse--green" />Galileo · 16602</span>
          <span className="cv-chip">block #4,218,907</span>
        </div>
        <div className="cv-topbar-r">
          <button className="cv-btn cv-btn--ghost">share</button>
          <button className="cv-btn cv-btn--ghost">manifest</button>
          <button className="cv-btn cv-btn--primary">▸ execute</button>
          <span className="cv-wallet">0x4f3a…b27c</span>
        </div>
      </header>
      <div className="cv-grid-area">
        <aside className="cv-side">
          <div className="cv-side-section">
            <div className="cv-side-eyebrow">Palette</div>
            {PALETTE.map(p => <PaletteItem key={p.tone} {...p} variant={variant} density={density} />)}
          </div>
          <div className="cv-side-section">
            <div className="cv-side-eyebrow">Templates</div>
            <div className="cv-tpl-item is-active">
              <span className="cv-tpl-dot" />
              <div>
                <div className="cv-tpl-name">DeFi Signal Analyzer</div>
                <div className="cv-tpl-meta">4 nodes · TEE · memory</div>
              </div>
            </div>
            <div className="cv-tpl-item">
              <span className="cv-tpl-dot" />
              <div>
                <div className="cv-tpl-name">Verifiable Memory Chat</div>
                <div className="cv-tpl-meta">5 nodes · sealed</div>
              </div>
            </div>
            <div className="cv-tpl-item">
              <span className="cv-tpl-dot" />
              <div>
                <div className="cv-tpl-name">Agent Research Loop</div>
                <div className="cv-tpl-meta">3 nodes · chained</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="cv-main">
          <div className="cv-canvas">
            <CanvasScene variant={variant} density={density} />
            <div className="cv-mini">
              <div className="cv-mini-label">MiniMap</div>
              <svg viewBox="0 0 820 460" width="100%" height="74">
                <rect x="0" y="0" width="820" height="460" fill="rgba(0,0,0,0.25)"/>
                {SCENE.nodes.map(n => (
                  <rect key={n.id} x={n.x} y={n.y} width="250" height="80" rx="6"
                        fill={`var(--${n.tone}-500)`} opacity="0.9"/>
                ))}
              </svg>
            </div>
            <div className="cv-canvas-controls">
              <button>＋</button><button>−</button><button>⛶</button><button>⌖</button>
            </div>
            <div className="cv-canvas-footer">
              <span>4 nodes · 4 edges</span>
              <span>·</span>
              <span>autosave · 2s ago</span>
              <span>·</span>
              <span>zoom 92%</span>
            </div>
          </div>
          <ExecLog variant={variant} />
        </main>
      </div>
    </div>
  );
}

window.WorkflowCanvas = WorkflowCanvas;
