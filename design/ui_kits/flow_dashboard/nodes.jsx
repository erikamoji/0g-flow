/* global React */
const { useState } = React;

// ---------- Input Node ----------
function InputNode({ data, selected, onSelect, status }) {
  return (
    <div className={`node node-input ${selected ? 'selected' : ''}`}
         style={{ left: data.x, top: data.y }} onClick={onSelect}>
      <span className="port l"/>
      <span className="port r"/>
      <div className="node-head">
        <div className="icon"><Icons.input/></div>
        <div className="title">
          <div className="name">{data.name}</div>
          <div className="id">{data.id} · TRIGGER · MANUAL</div>
        </div>
        <span className={`status status-${status}`}/>
      </div>
      <div className="node-body">
        <div className="node-pre">
{`{
  `}<span className="key">"event"</span>{`: `}<span className="str">"manual"</span>{`,
  `}<span className="key">"payload"</span>{`: { `}<span className="key">"k"</span>{`: `}<span className="num">42</span>{` }
}`}
        </div>
        <div className="node-row">
          <span className="l">Schema</span>
          <span className="v">JSON · 256B max</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">SOURCE</span>
        <span className="v">webhook · /trigger</span>
      </div>
    </div>
  );
}

// ---------- Logic Node ----------
function LogicNode({ data, selected, onSelect, status, sealed, setSealed }) {
  return (
    <div className={`node node-logic ${selected ? 'selected' : ''}`}
         style={{ left: data.x, top: data.y, width: 280 }} onClick={onSelect}>
      <span className="port l"/>
      <span className="port r"/>
      <div className="node-head">
        <div className="icon"><Icons.logic/></div>
        <div className="title">
          <div className="name">{data.name}</div>
          <div className="id">{data.id} · 0G COMPUTE</div>
        </div>
        <span className={`status status-${status}`}/>
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Model</span>
          <span className="v violet">qwen2.5-7b</span>
        </div>
        <div className="node-row">
          <span className="l">Provider</span>
          <span className="v">0g-compute · galileo</span>
        </div>
        <Toggle on={sealed} onChange={setSealed}>Sealed inference</Toggle>
        <div className="node-row">
          <span className="l">Temp</span>
          <span className="v">0.7 · max 512 tok</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">PROOF</span>
        <span className="v">tee · attested</span>
      </div>
    </div>
  );
}

// ---------- Anchor Node ----------
function AnchorNode({ data, selected, onSelect, status }) {
  return (
    <div className={`node node-anchor ${selected ? 'selected' : ''}`}
         style={{ left: data.x, top: data.y }} onClick={onSelect}>
      <span className="port l"/>
      <span className="port r"/>
      <div className="node-head">
        <div className="icon"><Icons.anchor/></div>
        <div className="title">
          <div className="name">{data.name}</div>
          <div className="id">{data.id} · 0G STORAGE</div>
        </div>
        <span className={`status status-${status}`}/>
      </div>
      <div className="node-body">
        <div className="node-row">
          <span className="l">Bucket</span>
          <span className="v emerald">flow / receipts</span>
        </div>
        <div className="node-row">
          <span className="l">Hash</span>
          <span className="v">keccak256</span>
        </div>
        <div className="node-row">
          <span className="l">Anchor</span>
          <span className="v">on-chain · galileo</span>
        </div>
        <div className="node-row">
          <span className="l">Replicas</span>
          <span className="v">3 / 3 confirmed</span>
        </div>
      </div>
      <div className="node-foot">
        <span className="meta">LAST TX</span>
        <span className="v" style={{ color: 'var(--input-300)' }}>0x4f3a…b27c</span>
      </div>
    </div>
  );
}

Object.assign(window, { InputNode, LogicNode, AnchorNode });
