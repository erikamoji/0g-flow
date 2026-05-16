// landing-hero.jsx — the marketing landing surface (hero + archetypes + verify + receipt)

const HERO_LINES = [
  { t: '00:00.000', g: '◦', cls: 'sys', text: 'manifest compiled · workflow_id=wf-7k2m-9xab' },
  { t: '00:00.041', g: '◦', cls: 'sys', text: 'registerWorkflow → 0G Chain · 0x4f3a…b27c ↗' },
  { t: '00:00.612', g: '◆', cls: 'in',  text: 'data_input · ETH/USDC market feed' },
  { t: '00:01.221', g: '◆', cls: 'lo',  text: 'ai_compute · router-api.0g.ai · sealed=true' },
  { t: '00:01.704', g: '◆', cls: 'lo',  text: 'inference complete · 142 tok' },
  { t: '00:01.851', g: '✓', cls: 'ok',  text: 'TEE ✓ · tee_verified · provider 0x4f3a…' },
  { t: '00:02.118', g: '◆', cls: 'an',  text: 'storage_anchor · 0G Storage · 0x8fa2…e31d' },
  { t: '00:02.231', g: '✓', cls: 'ok',  text: 'recordExecution · permanently verifiable' },
];

const ARCHETYPES = [
  { tone: 'input',  eyebrow: 'Input',   title: 'Trigger your pipelines.',
    body: 'Manual payload, API call, or schedule. Every input becomes a portable, signed event.',
    tags: ['JSON', 'API', 'CRON'] },
  { tone: 'logic',  eyebrow: 'Compute', title: 'Sealed AI, on demand.',
    body: 'Route inference through 0G Compute with verify_tee. Outputs ship with attestation, not promises.',
    tags: ['0G ROUTER', 'TEE ✓', 'STREAM'] },
  { tone: 'memory', eyebrow: 'Memory',  title: 'Stateful agent memory.',
    body: 'Read and write persistent context across runs. Every key is a root hash on 0G Storage.',
    tags: ['READ / WRITE', 'ROOT HASH', 'PORTABLE'] },
  { tone: 'anchor', eyebrow: 'Anchor',  title: 'Receipts, not promises.',
    body: 'Outputs settle to 0G Storage and provenance lives on 0G Chain. Anyone can audit by workflow ID.',
    tags: ['0G STORAGE', 'REGISTRY', 'ON-CHAIN'] },
];

function HeroTerminal({ variant }) {
  return (
    <div className={`hero-term hero-term--${variant}`}>
      <div className="hero-term-bar">
        <span className="hero-term-dot" style={{ background: '#FF5F57' }} />
        <span className="hero-term-dot" style={{ background: '#FFBD2E' }} />
        <span className="hero-term-dot" style={{ background: '#28C840' }} />
        <span className="hero-term-label">$ 0g flow execute defi-signal-analyzer</span>
        <span className="hero-term-right">live · galileo</span>
      </div>
      <div className="hero-term-body">
        {HERO_LINES.map((l, i) => (
          <div key={i} className={`hero-term-line hero-term-line--${l.cls}`} style={{ animationDelay: `${0.2 + i * 0.18}s` }}>
            <span className="hero-term-t">{l.t}</span>
            <span className="hero-term-g">{l.g}</span>
            <span className="hero-term-text">{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchetypeCard({ tone, eyebrow, title, body, tags, variant }) {
  return (
    <div className={`arch arch--${variant}`} style={toneVars(tone)}>
      <div className="arch-icon"><NodeIcon tone={tone} /></div>
      <div className="arch-eyebrow">{eyebrow}</div>
      <h3 className="arch-title">{title}</h3>
      <p className="arch-body">{body}</p>
      <div className="arch-tags">
        {tags.map(t => <span key={t} className="arch-tag">{t}</span>)}
      </div>
    </div>
  );
}

function VerifyCard({ variant }) {
  const rows = [
    { k: 'Manifest Hash', v: '0x1a4f…c7b2', c: 'var(--fg-1)' },
    { k: 'Storage Key',   v: '0x8fa2…e31d', c: 'var(--input-300)' },
    { k: 'Created',       v: '2026-05-15 00:25', c: 'var(--fg-2)' },
    { k: 'Executions',    v: '3', c: 'var(--anchor-300)' },
    { k: 'Last Exec Tx',  v: '0x4f3a…b27c ↗', c: 'var(--input-300)' },
  ];
  return (
    <div className={`verify-card verify-card--${variant}`}>
      <div className="hero-term-bar">
        <span className="hero-term-dot" style={{ background: '#FF5F57' }} />
        <span className="hero-term-dot" style={{ background: '#FFBD2E' }} />
        <span className="hero-term-dot" style={{ background: '#28C840' }} />
        <span className="hero-term-label">verify · workflow_id</span>
      </div>
      <div className="verify-body">
        <div className="verify-input">
          <span className="verify-input-k">workflow_id</span>
          <span className="verify-input-v">wf-7k2m-9xab</span>
          <span className="verify-input-go">↵</span>
        </div>
        {rows.map(r => (
          <div key={r.k} className="verify-row">
            <span className="verify-k">{r.k}</span>
            <span className="verify-v" style={{ color: r.c }}>{r.v}</span>
          </div>
        ))}
        <div className="verify-stamp">● VERIFIED ON-CHAIN</div>
      </div>
    </div>
  );
}

// ───────────── full landing surface ─────────────

function LandingHero({ variant = 'dense', title = 'A · Dense' }) {
  return (
    <div className={`lp lp--${variant}`}>
      <nav className="lp-nav">
        <div className="lp-nav-l">
          <span className="lp-brand-mark" />
          <span className="lp-brand">0G Flow</span>
        </div>
        <div className="lp-nav-c">
          <a>Build</a><a>Run</a><a>Anchor</a><a>Verify</a><a>Docs</a>
        </div>
        <div className="lp-nav-r">
          <button className="lp-btn lp-btn--ghost">github ↗</button>
          <button className="lp-btn lp-btn--primary">connect wallet</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-l">
          <span className="lp-eyebrow">01 · A visual IDE for verifiable AI</span>
          <h1 className="lp-h1">
            Compose AI pipelines<br />
            you can <span className="lp-grad">prove ran</span>.
          </h1>
          <p className="lp-lede">
            Drag four primitives onto a canvas. Every workflow compiles to a portable manifest,
            executes through 0G Compute with TEE attestation, settles to 0G Storage, and anchors
            provenance on 0G Chain.
          </p>
          <div className="lp-verbs">
            <span className="lp-verb lp-verb--in">Compose</span>
            <span className="lp-verb-sep">·</span>
            <span className="lp-verb lp-verb--lo">Execute</span>
            <span className="lp-verb-sep">·</span>
            <span className="lp-verb lp-verb--an">Verify</span>
          </div>
          <div className="lp-hero-cta">
            <button className="lp-btn lp-btn--primary lp-btn--lg">launch canvas →</button>
            <button className="lp-btn lp-btn--ghost lp-btn--lg">read the manifest spec</button>
          </div>
          <div className="lp-hero-meta">
            <span>4 primitives</span><span>·</span>
            <span>0G mainnet · 16661</span><span>·</span>
            <span>3 templates ready</span>
          </div>
        </div>
        <div className="lp-hero-r">
          <HeroTerminal variant={variant} />
        </div>
      </section>

      <section className="lp-archetypes">
        <div className="lp-section-hd">
          <span className="lp-eyebrow">02 · Four primitives. Infinite workflows.</span>
          <h2 className="lp-h2">Every node is real work on a real layer.</h2>
        </div>
        <div className={`lp-arch-grid lp-arch-grid--${variant}`}>
          {ARCHETYPES.map(a => <ArchetypeCard key={a.tone} {...a} variant={variant} />)}
        </div>
      </section>

      <section className="lp-verify">
        <div className="lp-verify-l">
          <span className="lp-eyebrow">04 · Verify</span>
          <h2 className="lp-h2">Every workflow is <span className="lp-grad">permanently verifiable</span>.</h2>
          <p className="lp-lede">
            WorkflowRegistry anchors every execution to 0G Chain. Paste a workflow_id and the
            chain returns the manifest hash, storage key, and execution count — no account
            needed, no trust required.
          </p>
          <div className="lp-verbs lp-verbs--sm">
            <span className="lp-verb lp-verb--in">workflow_id</span>
            <span className="lp-verb-sep">·</span>
            <span className="lp-verb lp-verb--lo">manifestHash</span>
            <span className="lp-verb-sep">·</span>
            <span className="lp-verb lp-verb--an">storageKey</span>
          </div>
        </div>
        <div className="lp-verify-r">
          <VerifyCard variant={variant} />
        </div>
      </section>
    </div>
  );
}

window.LandingHero = LandingHero;
