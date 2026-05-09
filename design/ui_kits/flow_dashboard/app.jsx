/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Canvas with edges + nodes ----------
function Canvas({ running, sealed, setSealed, selected, setSelected, statuses }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 600 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Layout nodes proportional to canvas size — keeps things visible at any width.
  const layout = useMemo(() => {
    const cy = size.h * 0.36;
    return {
      input:  { id: 'IN·01', name: 'Input · Manual',     kind: 'input',  x: Math.max(40, size.w * 0.04),                 y: cy, w: 250 },
      logic:  { id: 'LX·07', name: '0G Compute · Sealed', kind: 'logic',  x: Math.max(330, size.w * 0.36),                y: cy, w: 280 },
      anchor: { id: 'AN·02', name: '0G Storage · Anchor', kind: 'anchor', x: Math.max(660, size.w * 0.70),                y: cy, w: 250 },
    };
  }, [size]);

  const nodeMeta = useMemo(() => ({
    input:  { ...layout.input,  status: statuses.input  },
    logic:  { ...layout.logic,  status: statuses.logic  },
    anchor: { ...layout.anchor, status: statuses.anchor },
  }), [layout, statuses]);

  // Edge endpoints — right port of source, left port of target
  const portY = (n) => n.y + 38; // node head ~38px tall, port mid
  const e1 = { x1: layout.input.x  + layout.input.w,  y1: portY(layout.input),  x2: layout.logic.x,  y2: portY(layout.logic),  color: 'url(#edge-in-lo)' };
  const e2 = { x1: layout.logic.x  + layout.logic.w,  y1: portY(layout.logic),  x2: layout.anchor.x, y2: portY(layout.anchor), color: 'url(#edge-lo-an)' };

  const path = (e) => {
    const dx = (e.x2 - e.x1) * 0.5;
    return `M ${e.x1} ${e.y1} C ${e.x1 + dx} ${e.y1}, ${e.x2 - dx} ${e.y2}, ${e.x2} ${e.y2}`;
  };

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div className="canvas"/>

      <svg className="canvas-edges" width="100%" height="100%">
        <defs>
          <linearGradient id="edge-in-lo" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6FB1FF"/>
            <stop offset="1" stopColor="#B49AFF"/>
          </linearGradient>
          <linearGradient id="edge-lo-an" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#B49AFF"/>
            <stop offset="1" stopColor="#5DE3A5"/>
          </linearGradient>
        </defs>
        <path d={path(e1)} className={`edge-path ${running ? 'flowing' : ''}`} stroke={e1.color}/>
        <path d={path(e2)} className={`edge-path ${running ? 'flowing' : ''}`} stroke={e2.color}/>
      </svg>

      <div className="canvas-nodes">
        <InputNode  data={layout.input}  status={statuses.input}  selected={selected === 'input'}  onSelect={() => setSelected('input')}/>
        <LogicNode  data={layout.logic}  status={statuses.logic}  selected={selected === 'logic'}  onSelect={() => setSelected('logic')}
                    sealed={sealed} setSealed={setSealed}/>
        <AnchorNode data={layout.anchor} status={statuses.anchor} selected={selected === 'anchor'} onSelect={() => setSelected('anchor')}/>
      </div>

      <Inspector
        node={selected ? nodeMeta[selected] : null}
        sealed={sealed} setSealed={setSealed}
      />

      <Minimap/>
      <ZoomControls/>
    </div>
  );
}

// ---------- App root ----------
function App() {
  const [running, setRunning] = useState(false);
  const [sealed, setSealed] = useState(true);
  const [selected, setSelected] = useState('logic');
  const [statuses, setStatuses] = useState({ input: 'ok', logic: 'idle', anchor: 'idle' });
  const [activeRun, setActiveRun] = useState('run-2k4f');

  const runs = [
    { id: 'run-2k4f', when: '13s ago',  duration: '2.40s', cost: '0.0042 ETH', tx: '0x4f3a…b27c', block: '2,481,902',
      status: 'ok', statusLabel: 'Run · Complete',
      steps: [
        { kind: 'input',  name: 'Input · Manual',         sub: 'IN·01 · payload 18B', duration: '12ms',   status: 'ok' },
        { kind: 'logic',  name: '0G Compute · Qwen 2.5',  sub: 'LX·07 · sealed · 142 tok', duration: '1.94s', status: 'ok' },
        { kind: 'anchor', name: '0G Storage · Anchor',    sub: 'AN·02 · keccak256 · 3/3 replicas', duration: '440ms', status: 'ok' },
      ] },
    { id: 'run-2k4e', when: '4m ago',   duration: '2.18s', cost: '0.0039 ETH', tx: '0x9b1e…2de4', block: '2,481,890',
      status: 'ok', statusLabel: 'Run · Complete',
      steps: [
        { kind: 'input',  name: 'Input · Webhook',        sub: 'IN·01 · 11B',         duration: '8ms',  status: 'ok' },
        { kind: 'logic',  name: '0G Compute · GLM-4',     sub: 'LX·07 · sealed',      duration: '1.7s', status: 'ok' },
        { kind: 'anchor', name: '0G Storage · Anchor',    sub: 'AN·02 · 3/3',         duration: '420ms', status: 'ok' },
      ] },
    { id: 'run-2k4d', when: '12m ago',  duration: '0.18s', cost: '— gas refund', tx: '—', block: '—',
      status: 'idle', statusLabel: 'Sealed Reject',
      steps: [
        { kind: 'input',  name: 'Input · Manual',  sub: 'IN·01 · payload 312B', duration: '8ms', status: 'ok' },
        { kind: 'logic',  name: '0G Compute',      sub: 'LX·07 · payload exceeds 256B', duration: '120ms', status: 'err' },
      ] },
    { id: 'run-2k4c', when: '38m ago',  duration: '2.62s', cost: '0.0044 ETH', tx: '0x71fa…58a0', block: '2,481,711',
      status: 'ok', statusLabel: 'Run · Complete',
      steps: [
        { kind: 'input',  name: 'Input · Webhook',  sub: 'IN·01', duration: '14ms',  status: 'ok' },
        { kind: 'logic',  name: '0G Compute · Qwen', sub: 'LX·07 · sealed', duration: '2.0s', status: 'ok' },
        { kind: 'anchor', name: '0G Storage',       sub: 'AN·02 · 3/3',     duration: '600ms', status: 'ok' },
      ] },
  ];

  // Animate Deploy: idle → running → done
  const onDeploy = () => {
    if (running) return;
    setRunning(true);
    setStatuses({ input: 'run', logic: 'idle', anchor: 'idle' });
    const t1 = setTimeout(() => setStatuses({ input: 'ok',  logic: 'run',  anchor: 'idle' }), 380);
    const t2 = setTimeout(() => setStatuses({ input: 'ok',  logic: 'ok',   anchor: 'run'  }), 1900);
    const t3 = setTimeout(() => {
      setStatuses({ input: 'ok', logic: 'ok', anchor: 'ok' });
      setRunning(false);
      setActiveRun('run-2k4f');
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  };

  return (
    <div className="app-shell">
      <Header running={running} onDeploy={onDeploy}/>
      <div className="app-body">
        <Sidebar/>
        <Canvas
          running={running}
          sealed={sealed} setSealed={setSealed}
          selected={selected} setSelected={setSelected}
          statuses={statuses}
        />
      </div>
      <Drawer runs={runs} activeRun={activeRun} setActiveRun={setActiveRun} sealed={sealed}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
