/* global React */
const { useState } = React;

// ---------- Drawer (Job Receipt) ----------
function Drawer({ runs, activeRun, setActiveRun, sealed }) {
  const [tab, setTab] = useState('receipt');
  const [collapsed, setCollapsed] = useState(false);
  const run = runs.find(r => r.id === activeRun) || runs[0];

  return (
    <div className={`drawer ${collapsed ? 'collapsed' : ''}`}>
      <div className="drawer-handle" onClick={() => setCollapsed(c => !c)}/>
      <div className="drawer-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="eyebrow">Job Receipt</span>
          <div className="drawer-tabs">
            {['receipt', 'logs', 'json', 'trace'].map(k => (
              <span key={k} className={`drawer-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                {k[0].toUpperCase() + k.slice(1)}
              </span>
            ))}
          </div>
        </div>
        <div className="drawer-meta">
          <Pill tone={run.status === 'ok' ? 'ok' : run.status === 'idle' ? 'idle' : 'logic'}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}/>
            {run.statusLabel}
          </Pill>
          <span style={{ font: 'var(--t-meta)', letterSpacing: '0.12em', color: 'var(--fg-3)' }}>
            {run.duration} · {run.steps.length} STEPS
          </span>
          <button className="icon-btn" title="Open in explorer"><Icons.link/></button>
          <button className="icon-btn" title="Collapse" onClick={() => setCollapsed(c => !c)}>
            <Icons.chevron/>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="drawer-body">
          <div className="drawer-sidebar">
            <Eyebrow>Recent runs</Eyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {runs.map(r => (
                <div key={r.id} className={`run-row ${r.id === activeRun ? 'active' : ''}`}
                     onClick={() => setActiveRun(r.id)}>
                  <span className={`status status-${r.status === 'ok' ? 'ok' : r.status === 'idle' ? 'idle' : 'run'}`}/>
                  <div className="col">
                    <div className="id">{r.id}</div>
                    <div className="when">{r.when}</div>
                  </div>
                  <div className="right">
                    <div className="dur">{r.duration}</div>
                    <div style={{ font: 'var(--t-meta)', letterSpacing: '0.12em', color: 'var(--fg-3)', marginTop: 2 }}>
                      {r.cost}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="drawer-main">
            {tab === 'receipt' && <ReceiptPanel run={run} sealed={sealed}/>}
            {tab === 'logs'    && <LogsPanel run={run}/>}
            {tab === 'json'    && <JsonPanel/>}
            {tab === 'trace'   && <TracePanel run={run}/>}
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptPanel({ run, sealed }) {
  return (
    <div>
      <div className="receipt-grid">
        <div className="kv"><div className="l">Manifest</div><div className="v">galileo · ai-summary · v0.4.2</div></div>
        <div className="kv"><div className="l">Tx hash</div>
          <div className="v tx">{run.tx} <span title="copy"><Icons.copy/></span> <span title="explorer"><Icons.link/></span></div>
        </div>
        <div className="kv"><div className="l">Block</div><div className="v">{run.block}</div></div>
        <div className="kv"><div className="l">Submitter</div><div className="v">0x9a3f…4c1e</div></div>
        <div className="kv"><div className="l">Duration</div><div className="v">{run.duration} · 380ms ttft</div></div>
        <div className="kv"><div className="l">Cost</div><div className="v">{run.cost} · 1,240 gas</div></div>
        <div className="kv"><div className="l">Sealed inference</div><div className="v" style={{ color: sealed ? 'var(--ok-500)' : 'var(--idle-500)' }}>{sealed ? '✓ TEE attested' : 'unsealed'}</div></div>
        <div className="kv"><div className="l">Anchored</div><div className="v" style={{ color: 'var(--anchor-300)' }}>3 / 3 replicas confirmed</div></div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Eyebrow>Execution graph</Eyebrow>
        <div className="steps">
          {run.steps.map((s, i) => (
            <div key={i} className={`step ${s.kind}`}>
              <span className="pip"/>
              <div>
                <div className="name">{s.name}</div>
                <div className="sub">{s.sub}</div>
              </div>
              <div className="right">
                <span className="dur">{s.duration}</span>
                <span className={`status status-${s.status}`}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogsPanel({ run }) {
  const lines = [
    { t: '00.000s', lvl: 'info', msg: 'Manifest loaded · v0.4.2 · 3 nodes · 2 edges' },
    { t: '00.012s', lvl: 'info', msg: <>Trigger fired · payload <span className="hl">{`{ k: 42 }`}</span></> },
    { t: '00.018s', lvl: 'info', msg: 'Routing IN·01 → LX·07 (sealed)' },
    { t: '00.380s', lvl: 'ok',   msg: 'TEE attested · qwen2.5-7b · 380ms ttft' },
    { t: '01.940s', lvl: 'ok',   msg: 'Inference complete · 142 tokens · 1,560ms' },
    { t: '01.952s', lvl: 'info', msg: 'Routing LX·07 → AN·02 (anchor)' },
    { t: '02.110s', lvl: 'info', msg: 'Computing keccak256 of payload + result' },
    { t: '02.140s', lvl: 'ok',   msg: <>Anchored on Galileo · tx <span className="hl">{run.tx}</span></> },
    { t: '02.380s', lvl: 'ok',   msg: 'Run complete · receipt emitted · 3/3 replicas' },
  ];
  return (
    <div className="logs">
      {lines.map((l, i) => (
        <div key={i} className="line">
          <span className="t">{l.t}</span>
          <span className={`lvl ${l.lvl}`}>{l.lvl.toUpperCase()}</span>
          <span className="msg">{l.msg}</span>
        </div>
      ))}
    </div>
  );
}

function JsonPanel() {
  return (
    <div className="json">
{`{
  `}<span className="key">"manifest"</span>{`: `}<span className="str">"galileo·ai-summary·v0.4.2"</span>{`,
  `}<span className="key">"trigger"</span>{`: { `}<span className="key">"event"</span>{`: `}<span className="str">"manual"</span>{`, `}<span className="key">"payload"</span>{`: { `}<span className="key">"k"</span>{`: `}<span className="num">42</span>{` } },
  `}<span className="key">"compute"</span>{`: {
    `}<span className="key">"model"</span>{`: `}<span className="str">"qwen2.5-7b"</span>{`,
    `}<span className="key">"sealed"</span>{`: `}<span className="bool">true</span>{`,
    `}<span className="key">"output"</span>{`: `}<span className="str">"…"</span>{`,
    `}<span className="key">"tokens"</span>{`: `}<span className="num">142</span>{`,
    `}<span className="key">"ttft_ms"</span>{`: `}<span className="num">380</span>{`
  },
  `}<span className="key">"anchor"</span>{`: {
    `}<span className="key">"hash"</span>{`: `}<span className="str">"0x4f3a…b27c"</span>{`,
    `}<span className="key">"block"</span>{`: `}<span className="num">2481902</span>{`,
    `}<span className="key">"replicas"</span>{`: `}<span className="num">3</span>{`,
    `}<span className="key">"confirmed"</span>{`: `}<span className="bool">true</span>{`
  }
}`}
    </div>
  );
}

function TracePanel({ run }) {
  return (
    <div>
      <Eyebrow>Span trace · {run.duration}</Eyebrow>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { name: 'trigger.fire',       kind: 'input',  start: 0,    width: 4,  dur: '12ms'  },
          { name: 'route → compute',    kind: 'logic',  start: 4,    width: 2,  dur: '6ms'   },
          { name: 'tee.attest',         kind: 'logic',  start: 6,    width: 16, dur: '380ms' },
          { name: 'inference.qwen2.5',  kind: 'logic',  start: 6,    width: 80, dur: '1.56s' },
          { name: 'route → anchor',     kind: 'anchor', start: 86,   width: 2,  dur: '12ms'  },
          { name: 'hash.keccak256',     kind: 'anchor', start: 88,   width: 2,  dur: '30ms'  },
          { name: 'commit.galileo',     kind: 'anchor', start: 90,   width: 6,  dur: '230ms' },
        ].map((s, i) => {
          const color = s.kind === 'input' ? '#6FB1FF' : s.kind === 'logic' ? '#B49AFF' : '#5DE3A5';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', gap: 12, alignItems: 'center', padding: '4px 0' }}>
              <span style={{ font: 'var(--t-num)', color: 'var(--fg-2)' }}>{s.name}</span>
              <div style={{ position: 'relative', height: 16, background: 'var(--bg-0)', borderRadius: 3, border: '1px solid var(--line-1)' }}>
                <div style={{
                  position: 'absolute', left: `${s.start}%`, width: `${s.width}%`, top: 2, bottom: 2,
                  background: color, borderRadius: 2, opacity: 0.85,
                  boxShadow: `0 0 10px -2px ${color}`,
                }}/>
              </div>
              <span style={{ font: 'var(--t-num)', color: 'var(--fg-3)', textAlign: 'right' }}>{s.dur}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Drawer });
