/* global React */
const { useState } = React;

// ---------- Header ----------
function Header({ running, onDeploy }) {
  return (
    <div className="hdr">
      <div className="hdr-left">
        <div className="hdr-mark">
          <img src="../../assets/logos/flow-wordmark.svg" alt="0G Flow"/>
        </div>
        <div className="hdr-crumb">
          <span>Workspace</span>
          <span className="sep">/</span>
          <span>Galileo Demo</span>
          <span className="sep">/</span>
          <span className="here">manifest · v0.4.2</span>
        </div>
      </div>
      <div className="hdr-right">
        <div className="hdr-net"><span className="dot"/>Galileo Testnet · 16601</div>
        <button className="btn btn-quiet btn-icon" title="Settings"><Icons.gear/></button>
        <button className="btn btn-wallet">
          <span className="avatar"/>
          <span className="addr">0x9a3f…4c1e</span>
          <span className="bal">2.41 ETH</span>
        </button>
        <button
          className={`btn btn-deploy ${running ? 'is-running' : 'is-pulsing'}`}
          onClick={onDeploy}>
          {running
            ? <><span className="shimmer"/> Running…</>
            : <><span style={{ width: 14, height: 14, display: 'inline-block' }}><Icons.zap/></span> Deploy</>
          }
        </button>
      </div>
    </div>
  );
}

// ---------- Sidebar (Node palette) ----------
function Sidebar() {
  const items = [
    { kind: 'input',  name: 'Input',  sub: 'Webhook · JSON · Schedule', desc: 'Trigger / data ingestion' },
    { kind: 'input',  name: 'Webhook', sub: 'POST /trigger',            desc: 'Listen for HTTP events' },
    { kind: 'logic',  name: 'Compute', sub: '0G · Qwen / GLM',          desc: 'Sealed inference' },
    { kind: 'logic',  name: 'Transform', sub: 'JSONata / JS',           desc: 'Map · filter · merge' },
    { kind: 'anchor', name: 'Storage', sub: '0G · Anchor on-chain',     desc: 'Persist + commit' },
    { kind: 'anchor', name: 'Receipt', sub: 'Manifest hash',            desc: 'Emit signed receipt' },
  ];
  const Glyph = { input: Icons.input, logic: Icons.logic, anchor: Icons.anchor };
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <Eyebrow>Manifest</Eyebrow>
        <div style={{ marginTop: 8, font: 'var(--t-h3)', color: 'var(--fg-1)' }}>Galileo · ai-summary</div>
        <div style={{ marginTop: 4, font: 'var(--t-meta)', color: 'var(--fg-3)', letterSpacing: '0.12em' }}>
          3 NODES · 2 EDGES · UNCOMMITTED
        </div>
      </div>
      <div className="sidebar-section">
        <div className="search">
          <Icons.search/>
          <input placeholder="Search nodes…"/>
          <span className="kbd">⌘K</span>
        </div>
      </div>
      <div className="sidebar-section">
        <Eyebrow>Node palette</Eyebrow>
        <div className="palette-list">
          {items.map((it, i) => {
            const G = Glyph[it.kind];
            return (
              <div key={i} className={`palette-item ${it.kind}`}>
                <div className="icon"><G/></div>
                <div className="meta">
                  <div className="name">{it.name}</div>
                  <div className="sub">{it.desc}</div>
                </div>
                <span style={{ font: 'var(--t-meta)', letterSpacing: '0.12em', color: 'var(--fg-4)' }}>·</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ---------- Inspector (floating, right) ----------
function Inspector({ node, sealed, setSealed }) {
  if (!node) return null;
  const tone = node.kind;
  const Glyph = { input: Icons.input, logic: Icons.logic, anchor: Icons.anchor }[tone];
  const iconBg = {
    input:  { bg: 'rgba(42,123,255,0.12)', color: 'var(--input-300)' },
    logic:  { bg: 'rgba(124,92,255,0.14)', color: 'var(--logic-300)' },
    anchor: { bg: 'rgba(16,185,129,0.14)', color: 'var(--anchor-300)' },
  }[tone];

  return (
    <div className="inspector">
      <div className="inspector-head">
        <div className="icon" style={{ background: iconBg.bg, color: iconBg.color }}>
          <Glyph/>
        </div>
        <div className="title">
          <div className="name">{node.name}</div>
        </div>
        <span className="id">{node.id}</span>
      </div>
      <div className="inspector-body">
        {tone === 'input' && (<>
          <div className="field">
            <span className="l">Trigger</span>
            <select defaultValue="manual">
              <option>manual</option>
              <option>webhook</option>
              <option>schedule · cron</option>
            </select>
          </div>
          <div className="field mono">
            <span className="l">Endpoint</span>
            <input defaultValue="https://flow.0g.ai/t/9a3f"/>
          </div>
          <div className="field mono">
            <span className="l">Schema (json)</span>
            <input defaultValue={`{ "k": <number> }`}/>
          </div>
        </>)}
        {tone === 'logic' && (<>
          <div className="field">
            <span className="l">Model</span>
            <select defaultValue="qwen2.5-7b">
              <option>qwen2.5-7b</option>
              <option>qwen2.5-32b</option>
              <option>glm-4-9b</option>
              <option>glm-4-32b</option>
            </select>
          </div>
          <div className="field"><span className="l">Provider</span>
            <select defaultValue="0g-compute"><option>0g-compute</option><option>0g-compute · tee</option></select>
          </div>
          <Toggle on={sealed} onChange={setSealed}>Sealed inference (TEE)</Toggle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><span className="l">Temperature</span><input defaultValue="0.7"/></div>
            <div className="field"><span className="l">Max tokens</span><input defaultValue="512"/></div>
          </div>
        </>)}
        {tone === 'anchor' && (<>
          <div className="field"><span className="l">Bucket</span><input defaultValue="flow / receipts"/></div>
          <div className="field"><span className="l">Hash function</span>
            <select defaultValue="keccak256"><option>keccak256</option><option>sha-256</option><option>blake3</option></select>
          </div>
          <div className="field"><span className="l">Replication</span>
            <select defaultValue="3"><option>1</option><option>3</option><option>5</option></select>
          </div>
          <Toggle on={true} onChange={()=>{}}>Anchor on-chain</Toggle>
        </>)}
      </div>
      <div className="inspector-foot">
        <span>VALIDATED · {tone === 'logic' && sealed ? 'SEALED' : 'UNSEALED'}</span>
        <span style={{ color: 'var(--ok-500)' }}>● READY</span>
      </div>
    </div>
  );
}

// ---------- Zoom / Minimap ----------
function ZoomControls() {
  return (
    <div className="zoom">
      <button title="Zoom in"><Icons.plus/></button>
      <button title="Zoom out"><Icons.minus/></button>
      <button title="Fit"><Icons.maximize/></button>
      <div className="level">100%</div>
    </div>
  );
}
function Minimap() {
  return (
    <div className="minimap">
      <div className="minimap-canvas">
        <div className="minimap-node input"  style={{ left: '10%', top: '40%', width: '20%' }}/>
        <div className="minimap-node logic"  style={{ left: '40%', top: '40%', width: '22%' }}/>
        <div className="minimap-node anchor" style={{ left: '72%', top: '40%', width: '20%' }}/>
      </div>
    </div>
  );
}

Object.assign(window, { Header, Sidebar, Inspector, ZoomControls, Minimap });
