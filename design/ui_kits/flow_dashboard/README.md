# ui_kits / flow_dashboard

A high-fidelity recreation of the **0G Flow** authoring dashboard — the canvas, custom nodes, header, and Job Receipt drawer described in the brief.

## What's here

| File          | What it is |
|---------------|------------|
| `index.html`  | The kit entry point. Mounts the dashboard at 1440 × 900. |
| `styles.css`  | Kit-only CSS. Pulls all tokens from `../../colors_and_type.css`. |
| `atoms.jsx`   | Inline icons + small primitives — `Pill`, `Toggle`, `TxChip`, `Eyebrow`. |
| `nodes.jsx`   | The three node archetypes — `InputNode`, `LogicNode`, `AnchorNode`. |
| `panels.jsx`  | `Header`, `Sidebar` (palette), `Inspector` (right-floating), `ZoomControls`, `Minimap`. |
| `drawer.jsx`  | `Drawer` (Job Receipt) + sub-panels `ReceiptPanel`, `LogsPanel`, `JsonPanel`, `TracePanel`. |
| `app.jsx`     | The `App` root + `Canvas` (lays out nodes + draws edges). |

## Click-thru behavior
- **Connect Wallet** is shown as already-connected (`0x9a3f…4c1e`) per common Wagmi/RainbowKit patterns.
- **Deploy** transitions through three states. Idle: brand-gradient pill with a soft pulse. Hover: shows `Deploy` + zap glyph. Click: switches to a slate "Running…" pill with a spinner; node statuses light up Input → Logic → Anchor in sequence; the active edges animate marching-ants. After ~2.4 s the run finalizes, all three nodes go green, and the Job Receipt drawer's `run-2k4f` is selected.
- **Selecting a node** lights its outer ring chromatically and populates the floating Inspector (top-right).
- **Sealed inference** toggle on the Logic node and Inspector are linked; flipping either updates the receipt panel's "Sealed inference" line.
- **Drawer tabs** switch between Receipt · Logs · JSON · Trace. The handle at top of the drawer collapses it to a 44-px header.

## Data model
Three nodes (`IN·01`, `LX·07`, `AN·02`) connected by two edges (`IN→LX`, `LX→AN`). Four mock runs in the drawer sidebar — three successful, one demonstrating the **Sealed Reject** error state (payload exceeds 256 B). Edge gradients run blue→violet (input→logic) and violet→emerald (logic→anchor), matching the modular-neon language.

## Caveats / asks
- The **wallet popover**, **manifest browser**, and **deploy confirmation modal** are not implemented — only the closed/connected states. Confirm you want these expanded.
- The **canvas drag/zoom** is presentational only — nodes are laid out proportionally to viewport. We did not pull React Flow in for this kit; if you want real pan/zoom + drag-to-connect, we can wire `reactflow` next iteration.
- The **wordmark and mark are placeholders** drawn from the brand-gradient stops. Replace `assets/logos/flow-{mark,wordmark}.svg` with the official artwork.
- **Lucide is used as the icon-set substitute** in this design system; the kit ships its own inline-SVG copies of the glyphs it needs (no Lucide dependency at runtime).
