# Handoff: 0G Flow — Canvas Redesign

A visual IDE for verifiable AI pipelines on the 0G network. Users drag four primitives (Input, Compute, Memory, Anchor) onto a canvas, execute the workflow through 0G Compute with TEE attestation, and settle results to 0G Storage with provenance on 0G Chain.

## About the Design Files

The files in this bundle are **design references created in HTML/React** — interactive prototypes showing intended look, layout, copy, and behavior. They are **not production code to ship as-is**.

Your task is to **recreate these designs in your target codebase's existing environment** using its established patterns, component library, routing, and styling system. The HTML prototypes are the source of truth for visuals; your codebase is the source of truth for engineering conventions.

If your project has no chosen framework yet, pick what fits the product — React + TypeScript is the natural target given the prototype, but Vue / Svelte / Solid are fine.

## Fidelity

**High-fidelity.** Exact colors, typography, spacing, and interaction details are all specified below and embedded in the HTML. Match pixel-for-pixel where you can; deviate only where your codebase's design system has a better-established equivalent.

## Files in This Bundle

| File | Purpose |
|---|---|
| `Workflow Canvas Redesign.html` | The runnable prototype. Open in a browser. Contains all CSS tokens inline. |
| `workflow-canvas.jsx` | The **Workflow Canvas** screen — topbar, sidebar, node canvas, exec log |
| `landing-hero.jsx` | The **Landing** page — hero + archetypes + verify section |
| `nodes.jsx` | The shared `NodeCard` + `NodeIcon` primitives used in both screens |
| `design-canvas.jsx`, `tweaks-panel.jsx` | Scaffolding for the design-review canvas + tweak panel. **Do not port these** — they're presentation chrome, not part of the product. |

The canvas variants (`filled` / `outline` / `glass`) and the landing variants (`dense` / `editorial`) are all in the JSX as toggleable props. **Locked-in direction** is documented below.

## Locked-in Direction

After review, these are the only variants that ship. Other branches in the JSX (`outline`, `glass`, `dense`) can be deleted on port.

| Token | Value | Notes |
|---|---|---|
| **Workflow Canvas variant** | `filled` | "Neon Terminal" — solid accent-tinted node cards with glow |
| **Landing variant** | `editorial` | Fraunces serif headlines, 2-column archetype grid |
| **Accent palette** | `hot` | Orange / pink / yellow / lime-green node tones |
| **Typography** | `mixed` | Inter Tight for everything, JetBrains Mono for monospace |
| **Density** | `compact` | Tighter padding on nodes, palette, log |
| **Glow strength** | `1` | `--glow-strength: 1` |
| **Grid opacity** | `0.07` | `--grid-opacity: 0.07` on dark, `0.10` on light |
| **Modes** | `light` + `dark` | Light = the `paper` theme tokens. Dark = the `dim` theme tokens. Toggle is user-visible. |

---

## Theme Tokens

All tokens live as CSS custom properties in `Workflow Canvas Redesign.html` under `<style>`. Port them into your design system (CSS variables, Tailwind config, theme provider, etc.).

### Dark mode (the `theme-dim` tokens — this is the default "dark")

```
--bg-0: #0F1218;  /* page background */
--bg-1: #161A22;  /* sidebar, topbar, cards */
--bg-2: #1D232C;  /* inputs, secondary surfaces */
--bg-3: #262D38;  /* hover, badge background */
--bg-4: #2F374A;  /* tertiary */

--line-1: #232A35;  /* subtle dividers */
--line-2: #2D3543;  /* default border */
--line-3: #3A4356;  /* emphasis border / grid dots */

--fg-1: #EAEDF2;  /* primary text */
--fg-2: #B5BCC9;  /* secondary text */
--fg-3: #7A8290;  /* tertiary text */
--fg-4: #555E6E;  /* labels, eyebrows */
```

### Light mode (the `theme-paper` tokens — warm off-white)

```
--bg-0: #F4F1EA;
--bg-1: #FAF7F1;
--bg-2: #FFFFFF;
--bg-3: #EFEAE0;
--bg-4: #E5DFD2;

--line-1: #E2DCCE;
--line-2: #D2CBB9;
--line-3: #B8AF99;

--fg-1: #1B1812;
--fg-2: #4A453B;
--fg-3: #6E6857;
--fg-4: #94896E;

--grid-opacity: 0.10;
```

### Accent palette — `hot` (locked)

The four node tones (input / logic / memory / anchor) drive every accent color in the product — node fills, edges, badge tints, hero gradient stops, archetype cards, log glyphs. Each has a 500 (base) and 300 (lifted / glow) shade.

```
--input-300:  #FFB36F;  --input-500: #F08A3A;  /* orange — Data Input */
--logic-300:  #FF95C8;  --logic-500: #E84A98;  /* pink   — 0G Compute */
--anchor-300: #FFE066;  --anchor-500: #F0C13A;  /* yellow — Storage Anchor */
--memory-300: #B6FF8F;  --memory-500: #6FCC3A;  /* lime   — Memory */

--ok:   #34D399;
--err:  #F47174;
--warn: #F08A3A;
```

The hero brand gradient is `linear-gradient(135deg, #6FB1FF 0%, #B49AFF 55%, #5DE3A5 100%)` (kept from base palette regardless of accent — it's the brand mark).

### Typography

```
--font-sans:    'Inter Tight', ui-sans-serif, system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
--font-display: 'Fraunces', serif;  /* ONLY on landing h1/h2 */
```

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Landing h1 (editorial) | Fraunces | 500 | 64px | -0.025em | 1.02 |
| Landing h2 (editorial) | Fraunces | 500 | 40px | -0.02em | 1.1 |
| Landing lede | Inter Tight | 400 | 15px | normal | 1.55 |
| Eyebrows | JetBrains Mono | 600 | 10px | 0.20em uppercase | 1 |
| Node title | Inter Tight | 600 | 12px | -0.01em | 1.25 |
| Node row keys | JetBrains Mono | 500 | 9px | 0.08em uppercase | 1.3 |
| Node row values | JetBrains Mono | 500 | 10.5px | normal | 1.3 |
| Log lines | JetBrains Mono | 400 | 11px | normal | — |
| Buttons | JetBrains Mono | 500 | 11px | 0.04em | 1.4 |
| Chips | JetBrains Mono | 400 | 10px | 0.04em | 1 |

### Spacing scale

Loose 4-px scale. Common values used: `4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 28 / 36 / 56 / 64 / 80`.

### Border radius

`3 / 4 / 5 / 6 / 7 / 8 / 10 / 12` — small for chips & badges, 6–8 for cards & buttons, 10–12 for major panels and the hero terminal.

### Shadows

```
/* Card lift (filled nodes) */
0 0 0 1px rgba(255,255,255,.02) inset,
0 8px 30px -10px color-mix(in oklab, var(--n) 50%, transparent),
0 1px 0 rgba(0,0,0,.4);

/* Floating overlays (minimap, canvas controls) */
0 8px 24px rgba(0,0,0,.4);

/* Hero terminal */
0 0 0 1px rgba(255,255,255,.03) inset,
0 24px 80px -30px rgba(124,92,255,.4),
0 0 60px -20px rgba(93,227,165,.18);
```

The `--n` variable in the node shadow resolves to the node's tone color (`--input-500` etc.) via inline `style={toneVars(tone)}`.

---

## Screens

### 1. Workflow Canvas (`workflow-canvas.jsx`)

**Purpose:** The product surface — users compose, run, and inspect AI workflows here.

**Layout:**
- `grid-template-rows: 56px 1fr` (compact: `48px 1fr`)
- Topbar: 3-column grid `1fr auto 1fr` for left / center / right groups
- Main area: 2 columns — sidebar `210px` (compact) and canvas `1fr`
- Canvas main column: `grid-template-rows: 1fr 170px` (canvas / exec log)

**Topbar (height 48px compact):**
- Left: brand mark (18×18 gradient block) + "0G Flow" + "/" + "defi-signal-analyzer" (all monospace 12px)
- Center: two chips — "Galileo · 16602" with green pulse, "block #4,218,907"
- Right: three buttons (share / manifest / **▸ execute** primary) + wallet pill "0x4f3a…b27c"

**Sidebar (210px compact):**
- Section "Palette" — 4 draggable items (Data Input / 0G Compute / Memory / Storage Anchor). Each is a `grid-template-columns: 28px 1fr 14px` row with tone-tinted icon, label + monospace description, drag grip `⋮⋮`. Background tinted with the tone's `--n-bg`, border with `--n-ring`.
- Section "Templates" — 3 items, one `is-active` with `logic-ring` border. Each shows a dot, name, and "4 nodes · TEE · memory" meta.

**Canvas region:**
- 22-px dot grid background at `0.07` opacity (`background-image: radial-gradient(circle, var(--line-3) 1px, transparent 1px); background-size: 22px 22px;`)
- 4 nodes positioned absolutely inside `.cv-scene` (inset `36px 80px 36px 36px`)
- SVG layer with cubic bezier edges connecting outputs to inputs. The active edge (`n1 → n2`) is dashed `6 4`, animates `stroke-dashoffset` 10→0 over 1.4s linear infinite, and has a small circle that follows the path via `animateMotion`.
- Top-left floating chip: "4 nodes · 4 edges · autosave · 2s ago · zoom 92%"
- Bottom-left zoom controls (`＋ − ⛶ ⌖`)
- Bottom-right minimap (160px, 8px padding) — labeled "MINIMAP", shows nodes as colored rects in an SVG viewBox.

**Nodes** (250px wide, 230px compact):
- Layout: header (icon 28×28, eyebrow `TONE · ID`, title) → badges row → border-top divider → key/value body
- Filled variant: background is `linear-gradient(180deg, color-mix(in oklab, var(--n) 14%, var(--bg-1)) 0%, var(--bg-1) 60%)`, border `color-mix(in oklab, var(--n) 35%, var(--line-2))`
- Selected (`is-selected`) gets a 2px ring in `--n2` and a stronger shadow
- Running state (`is-running` on `n2`) pulses the box-shadow over 2.2s
- Handles: 9×9 circles on left/right edges in the tone color with a 2px page-bg ring

**Four node contents** (from `workflow-canvas.jsx` `SCENE`):

| ID | Tone | Title | Badges | Rows |
|---|---|---|---|---|
| n1 | input | "ETH/USDC · Market Feed" | manual, JSON | source: cmc·spot, window: 24h, payload: `{ pair, ohlc, vol }` |
| n2 | logic | "Signal · Trend Reasoner" | **TEE** (ok), sealed | model: qwen3-vl-30b, router: router-api.0g.ai, prompt: "Score risk + trend on {{n1.output}}", tee: `verify_tee: true` |
| n3 | memory | "Memory · signal/eth-usdc" | read, 0G Storage | mode: read, mem_key: sig/eth-usdc/7d, root: 0x8fa2…e31d ↗ |
| n4 | anchor | "Anchor · signal-receipt" | WorkflowRegistry, **mainnet** (ok) | bucket: signals/2026, on_chain: recordExecution, tx: pending… |

**Edges:** `n1→n2` (live), `n1→n3`, `n3→n2`, `n2→n4`.

**Exec log (170px compact):**
- 32px header bar: 3 macOS-style traffic-light dots, "execute · wf-7k2m-9xab" label, tabs `log | manifest | verify | history` (log active in logic-300), right side "● live · galileo" in `--ok` green
- Body: monospace 11px lines, `grid-template-columns: 72px 14px 1fr` for timestamp / glyph / text
- Glyphs: `◦` for sys, `◆` for events, `✓` for ok
- Color tones map to node tones (`--input-300` / `--logic-300` / `--memory-300` / `--anchor-300`)
- Last line has a blinking caret `_` (1s steps(2) infinite)
- 9 sample lines documenting a full execution from manifest compile → TEE verify → storage anchor (see `LOG_LINES` in jsx)

### 2. Landing — Editorial (`landing-hero.jsx`)

**Purpose:** Marketing page that explains the product to devs and gets them to "launch canvas".

**Sections:**

**Nav (sticky, 56px):**
- 3-column grid `1fr auto 1fr`
- Left: brand mark (20×20) + "0G Flow" 14px bold
- Center: links — `Build · Run · Anchor · Verify · Docs` (mono 11px 0.12em uppercase)
- Right: "github ↗" ghost + "connect wallet" primary
- Background `color-mix(in oklab, var(--bg-1) 70%, transparent)` with 12px backdrop blur

**Hero (`padding: 96px 64px 72px` editorial, gap 72px):**
- 2 equal columns
- Left:
  - Eyebrow "01 · A visual IDE for verifiable AI" with a 24px leading rule
  - H1 Fraunces 500 64px "Compose AI pipelines / you can [prove ran]." — "prove ran" gets the brand gradient
  - Lede 15px/1.55 (full copy in JSX)
  - Verb strip "Compose · Execute · Verify" in tone colors
  - Two CTA buttons "launch canvas →" (primary), "read the manifest spec" (ghost), both `lp-btn--lg` 12×22 padding
  - Meta "4 primitives · 0G mainnet · 16661 · 3 templates ready"
- Right: **HeroTerminal** — full-width terminal panel matching the exec log style; 8 lines fade in at staggered 0.18s delays.
- Background: two radial gradients (logic + anchor, 8% opacity) behind everything.

**Archetypes (`padding: 80px 64px`):**
- Section header: eyebrow "02 · Four primitives. Infinite workflows." + H2 "Every node is real work on a real layer."
- 2×2 grid (gap 22px) — 4 cards, one per primitive
- Each card: `padding: 32px 28px`, gradient overlay from tone color (8% opacity, fading at 50%), top hairline gradient line in `--n2`
- Card contents: 36×36 tone icon → eyebrow → Fraunces 22px title → 12.5px body → tag chips
- Copy is in `ARCHETYPES` array — Input/Compute/Memory/Anchor

**Verify section:**
- 2 columns, padding `80px 64px 96px`, gap 72px
- Left: eyebrow "04 · Verify" + H2 with gradient on "permanently verifiable" + lede paragraph + small verb strip
- Right: **VerifyCard** — a workflow lookup mockup:
  - Terminal-style header "verify · workflow_id"
  - Input row with "workflow_id" label / "wf-7k2m-9xab" value (input-300) / ↵ button
  - 5 result rows (Manifest Hash, Storage Key, Created, Executions, Last Exec Tx)
  - Green "● VERIFIED ON-CHAIN" pill at the bottom

---

## Interactions & Behavior

| Trigger | Effect |
|---|---|
| Hover palette item | Translate-X 2px, 150ms |
| Drag palette item | Dispatch drag start. On drop into canvas → create node at drop coords using the tone's default config. |
| Click node | Set `is-selected` (2px ring). Open inspector panel (not yet designed — flag it). |
| Click "▸ execute" | Trigger workflow run. Stream log lines into exec log. Node n2 gets `is-running` (pulse animation). Active edge gets dashed-march + traveling dot. |
| Click log tab | Switch view (log / manifest / verify / history) — only `log` is mocked. |
| Click "launch canvas →" on landing | Navigate to the canvas route. |
| Mode toggle | Swap `theme-dark` ↔ `theme-paper` class on the root. **Persist choice** to localStorage. |

**Animations:**
- `edge-march`: `stroke-dashoffset 10 → 0` over 1.4s linear infinite, on live edges only
- `node-pulse`: 2.2s ease-in-out infinite on `is-running` nodes
- `pulse`: 1.8s ease infinite on status dots (opacity + scale 1 → 0.85)
- `blink`: 1s steps(2) infinite on the caret
- `term-fade`: 0.35s ease forwards opacity fade-in, staggered by 0.18s for hero terminal lines

**Responsive:** The prototypes are fixed-width (canvas 1180px, landing 1280px). When porting:
- Canvas screen: assume ≥1280px desktop only initially. Mobile is out of scope for v1.
- Landing: collapse hero to single column under 900px, archetypes to 1 column under 700px.

---

## State Management

Minimum state needed for the canvas screen:
- `nodes: Node[]` — id, tone, position {x, y}, status, title, badges, rows
- `edges: Edge[]` — from, to, live (boolean)
- `selectedNodeId: string | null`
- `executionState: 'idle' | 'running' | 'success' | 'error'`
- `logLines: LogLine[]` — appended as execution streams
- `theme: 'light' | 'dark'` — persisted to localStorage

Real network calls (not in prototype): register workflow, submit execution, stream TEE attestation, poll storage anchor receipt, query WorkflowRegistry by workflow_id.

---

## Assets

No external image assets. Everything is CSS, SVG, or inline glyphs (`◦ ◆ ✓ ✗ ▸ ⋮⋮ ↗ ↵ ＋ − ⛶ ⌖`). The node icons are inline SVG in `nodes.jsx` — port them as a small icon set or replace with your existing icon library if the tones match.

Fonts via Google Fonts: Inter Tight (400/500/600/700/800), JetBrains Mono (400/500/600/700), Fraunces (variable 9..144, weights 400/500/700).

---

## Implementation Notes

- **`color-mix(in oklab, ...)`** is used heavily for tone-tinted backgrounds and rings. It's well-supported (Safari 16.4+, Chrome 111+). If your target needs older support, precompute the mixed values per tone into static CSS variables.
- **Tone vars on a per-node basis:** each node sets `--n`, `--n2`, `--nbg`, `--nring` inline based on its tone, then the styles reference those generic vars. This pattern keeps the CSS DRY across 4 primitive types. Replicate in your component (e.g. style prop, or styled-components theme).
- **The `outline` and `glass` node variants** in the JSX are dead code post-handoff — delete them.
- **The `dense` landing variant** in the JSX is dead code — keep only `editorial`.
- **`design-canvas.jsx` and `tweaks-panel.jsx`** are review-time scaffolding. Don't port.

---

## Open Questions for the Engineering Team

1. Node inspector panel — not designed yet. What's the right surface (right-rail drawer? modal? inline expand)?
2. Empty canvas state — what does a user see before any node is placed?
3. Error states for failed execution — log line color and node treatment shown via `--err` but no full design.
4. Auth flow before "connect wallet" — assumed wagmi/RainbowKit but confirm.
5. Real-time log streaming — WebSocket? SSE? Decide per backend.
