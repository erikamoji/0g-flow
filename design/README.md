# 0G Flow — Design System

> **The Decentralized Operating System for AI Agents.**
> A high-performance, no-code visual orchestrator for the 0G modular blockchain — drag-and-drop construction of decentralized AI agents.

This repository captures the visual + interaction language for **0G Flow**: a pro-developer / "system-architect" tool that should feel at home next to a terminal on a high-end workstation. It is dark by default, dense by design, and modular by metaphor.

---

## What's here

| File / Folder                     | What it is |
|-----------------------------------|------------|
| `README.md`                       | This document — brand, content, visual + iconography rules. |
| `SKILL.md`                        | Agent SKILL header — entry point for Claude Code / agents. |
| `colors_and_type.css`             | All color, type, spacing, radius, shadow tokens as CSS vars. |
| `assets/`                         | Logos, marks, status glyphs, full-bleed imagery. |
| `preview/`                        | One HTML card per token cluster — feeds the Design System tab. |
| `ui_kits/flow_dashboard/`         | React/JSX pixel-fidel recreation of the Flow canvas + drawer. |

The **single source of truth** is `colors_and_type.css` — every kit and preview imports it, no values are duplicated. When in doubt, read the CSS first.

---

## Sources

This system was designed against the following inputs (provided by the brand owner):

- **Project brief** — pasted plain-text spec describing 0G Flow as a no-code visual orchestrator on the 0G modular blockchain. Defines theme ("Deep Dark / Coal-Slate with Modular Neon"), key components (Canvas, Nodes, Header, Results Drawer), and the three node archetypes (Input / Logic / Anchor).
- `uploads/editorial.html` — a single-page editorial-serif treatment of 0G Flow marketing copy. Source of voice & product copy ("Compose decentralized AI, visually."). Aesthetic was **not adopted** — the dashboard brief calls for a dark technical surface — but the language and verbs (Compose, Deploy, Anchor) are canonical.
- `uploads/brutalist.html`, `uploads/console.html` — generic blue-corporate templates that arrived under those names. **Disregarded** as visual references; they do not match the System-Architect direction in the brief.

> ⚠️ **Caveat** — there is no public 0G Flow codebase or Figma file referenced in the brief. The system below is an *interpretation* of the written spec, anchored in the verbs/copy from `editorial.html`. Once a real codebase or Figma exists, prefer those over this document.

---

## Brand at a glance

- **Tagline:** *The Decentralized Operating System for AI Agents.*
- **One-liner:** Compose decentralized AI, visually.
- **Verbs:** Compose · Deploy · Anchor
- **Network reference:** 0G Galileo Testnet
- **Audience:** Web3 developers + technical PMs who want n8n-class authoring for on-chain AI.
- **Pillars:**
  1. **Transparency** — every node, every output, every cost is visible.
  2. **Verifiability** — sealed inference + on-chain anchoring; show the receipt.
  3. **Modularity** — three node archetypes (Input · Logic · Anchor); compose, don't configure.

---

## CONTENT FUNDAMENTALS

How copy is written across surface UI, marketing, and docs.

### Voice
- **Pro-developer, not consumer.** Assumes the reader knows what a manifest, a hash, a testnet, and an inference are.
- **Verbs over nouns.** `Compose` not "Composition tool." `Deploy` not "Deployment workflow."
- **Cryptographic certainty as a feature.** Words like *sealed*, *anchored*, *signed*, *verifiable*, *immutable* are load-bearing.
- **Slightly literary at the marketing tier**, never at the UI tier. The editorial sample contains the line *"Workflows that outlive their authors are not artifacts—they're legacies encoded in trustless logic."* — that register is allowed on a landing page hero, never inside a tooltip.

### Person
- Marketing copy uses **second person** addressing the developer ("**Build** intelligent workflows… **Deploy** them on-chain").
- Product UI uses **imperative** ("Connect Wallet", "Deploy", "Inspect Run") — never "Click here" or "Please…".
- Avoid first-person plural ("we") in the product. Allowed sparingly in docs.

### Casing
- **Title-Case** for buttons and primary nav: `Connect Wallet`, `Deploy`, `Job Receipt`.
- **Sentence case** for descriptions, tooltips, helper text: `Drag a node from the palette to begin.`
- **ALL CAPS + monospace + tracked +0.12em** for tags, eyebrows, status labels, and section meta: `INPUT NODE`, `GALILEO TESTNET`, `IDLE`, `0G STORAGE`.

### Density & length
- Buttons: 1–2 words. Never a sentence.
- Tooltips: ≤ 12 words. Lead with the verb.
- Empty states: 1 sentence + 1 action. Mention the verb you want them to do (Compose / Deploy / Anchor).
- Error states: name *what* failed and *what to do next*. Hex codes, hashes, and error codes are welcome — this is a developer tool.

### Numerics & identifiers
- All hashes, addresses, IDs, gas values, and durations render in **`JetBrains Mono`**.
- Truncate addresses as `0x4f3a…b27c` (4-on-each-end, ellipsis is a single `…` glyph).
- Time deltas: `2.4s`, `380ms`, `12m 04s`. Never "two seconds."
- Costs: `0.0042 ETH` / `1,240 gas`. Always show the unit.

### Emoji
- **Not used in product UI**, ever. The aesthetic depends on it.
- Allowed in docs/changelogs at the section-header level only, sparingly.

### Vibe cheatsheet
| Don't write                      | Write instead                          |
|----------------------------------|----------------------------------------|
| "Awesome! Your flow ran 🎉"      | `Run complete · 2.4s · view receipt →` |
| "Click here to learn more"       | `Read the Galileo spec`                |
| "Something went wrong"           | `Sealed inference rejected — payload exceeds 256 KB` |
| "Powerful AI workflow builder"   | `Compose decentralized AI, visually.` |

---

## VISUAL FOUNDATIONS

The system is built around **one surface (deep coal/slate dark)**, **three accent neons** (one per node archetype), and a strict mono/sans pairing. There is no light theme; this is a workstation tool.

### Color
- **Coal & slate surfaces** — five tiers from `--bg-0` (page coal `#07090C`) through `--bg-4` (overlay `#232C3C`). Use the lowest tier that still contrasts with what's on top of it. Never elevate by shadow alone — always change the surface tone.
- **Modular neons, one per node archetype.** They are *semantic, not decorative*: never use Logic Violet to highlight an Input node. Each has a `glow` token used for the node's outer ring and active edges only.
  - **Input — Blue** `#2A7BFF` · raw data / triggers / JSON ingestion
  - **Logic — Violet** `#7C5CFF` · 0G Compute / model inference / sealed compute
  - **Anchor — Emerald** `#10B981` · 0G Storage / blockchain anchoring / persistence
- **Status palette** lives separately from the node palette: `ok` (emerald), `idle` (amber), `warn` (orange), `err` (rose). The status amber is *intentionally close but not equal* to any node neon.
- **Brand gradient** (`--brand-grad`) is reserved for the wordmark and the deploy button's pulse state — Blue → Violet → Emerald, in that order. It expresses the three pillars in one sweep.

### Type
- **Inter Tight** for all UI sans (400 / 500 / 600 / 700). Tight tracking, neutral, technical.
- **JetBrains Mono** for *anything that is data*: hashes, ids, gas values, code blocks, status eyebrows, kbd shortcuts.
- No serif. The editorial sample's Newsreader is **not** part of the product system.
- **Display** sizes (32px+) get `letter-spacing: -0.01em`. Body text is set tight at 1.55.
- Eyebrows / tags use mono caps with `letter-spacing: 0.12em`. Never set lowercase mono labels — if you see one, it's wrong.

### Spacing
- 4-px base grid: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.
- Card inner padding: 24px. Panel inner padding: 16px. Node inner padding: 12px.
- Nodes sit on a **24-px dotted canvas grid**. Snap-to-grid is preferred; do not draw subpixel-offset nodes.

### Borders & radii
- Borders are **always** `1px` and **always** one of `--line-1 · --line-2 · --line-3`. Never set arbitrary hex on a border.
- Radii: `3 · 6 · 8 · 10 · 14 · 20`. Nodes use `10`. Cards use `14`. Drawers/modals use `20`. Inputs and ports use `6`. Don't go wilder than 20 anywhere.
- **No "rounded card with colored left border"** — that pattern is forbidden in this system.

### Shadows, glows, elevation
- **Shadows are subtle.** A combination of a 1px inner highlight (`rgba(255,255,255,0.02–0.04)`) and a long, heavy ambient (`rgba(0,0,0,0.45–0.55)`). See `--shadow-1/2/3`.
- **Glow rings on nodes are the primary form of elevation.** Each archetype has its own glow token — `--glow-input/logic/anchor` — applied as a soft outer halo + 1px chromatic ring.
- Focus is `--ring-focus`: a 1px coal gap + a 3px Input-Blue ring. Don't use accent colors for focus rings other than blue.

### Backgrounds
- Page background is solid `--bg-0`.
- The canvas itself uses a **dotted grid** (`.flow-canvas-bg`) — 1-px dots at 24-px intervals at 4.5% opacity.
- **No gradients** as page backgrounds, ever. The brand gradient is for the wordmark + Deploy button pulse only.
- **No imagery** as background. This is a tool, not a marketing site. Empty states use a single muted icon + one line of copy.

### Animation
- **Motion is functional, not decorative.**
- Easing: prefer `cubic-bezier(0.2, 0.8, 0.2, 1)` (a calm material-style ease-out) for entrance/exit, and a tight `cubic-bezier(0.4, 0, 0.6, 1)` for state changes.
- Durations: `120ms` (hover), `200ms` (state), `320ms` (drawer/modal). Anything longer feels sluggish in a dev tool.
- The **Deploy** button has a `pulse` while ready-to-execute and a continuous slow shimmer along the brand gradient while running. Reserved exclusively for that button.
- Edges in the canvas animate with a faint dashed marching-ants flow when a run is active. ≤ 1 cycle/sec.
- **No bounces.** No spring overshoot. This system is steady-handed.

### Hover / press / focus
| State   | Surfaces                                            | Buttons (primary)                              | Buttons (ghost)                              |
|---------|-----------------------------------------------------|------------------------------------------------|----------------------------------------------|
| Hover   | bg moves up one tier (`--bg-2` → `--bg-3`)          | gradient brightens 6%, glow intensifies        | bg fades in to `--bg-2` at 60% opacity       |
| Press   | bg drops back, `transform: translateY(0.5px)`        | `transform: translateY(0.5px)`, glow narrows  | bg solidifies to `--bg-2`                    |
| Focus   | `--ring-focus` (3px Input-Blue) outside-only        | same                                           | same                                         |
| Active  | leaves a 1px `--input-500` left edge on selectables  | gradient remains lit                           | text → `--input-300`                         |

### Transparency & blur
- Used sparingly. Two cases only:
  1. **Drawer / popover** backdrops: `rgba(7,9,12,0.6)` + `backdrop-filter: blur(8px)`.
  2. **Status pills** on glowing nodes: 12% white over the node bg.
- Never blur over the canvas itself (kills perceived perf).

### Imagery
- Avoid stock imagery entirely. The product surfaces are diagram-and-data — no photography, no illustration. The single exception is the **brand mark gradient**.
- If you must show a "person/team," use the wordmark or a minimal mono-line iconography placeholder (see ICONOGRAPHY).

### Layout rules
- The dashboard is **three-zone**: 56px top header, optional 280px left palette, fluid canvas. The Results Drawer slides up from the bottom, occupying 40% viewport height by default with a drag handle to expand.
- Header is *fixed*. Drawer is *fixed*. Canvas owns everything between.
- Canvas zoom controls and the mini-map live in the **bottom-right** of the canvas, never the top.

### Cards
- Card = `bg: var(--bg-2)` · `border: 1px solid var(--line-2)` · `radius: 14` · `padding: 24` · `shadow: --shadow-2` (only when raised over the canvas).
- A card can carry **at most one** colored accent — usually a 1-px top edge in the relevant node neon, or a single colored eyebrow. Never both.

---

## ICONOGRAPHY

0G Flow uses a single, consistent **outlined mono-line icon set** at **1.5px stroke**, **24×24 viewBox**, square caps, square joins. There is no built-in icon font — icons are rendered as inline SVG.

### What's included in `assets/`
- `assets/logos/` — the 0G Flow wordmark (`flow-mark.svg`, `flow-wordmark.svg`) plus a 32×32 favicon.
- `assets/icons/` — a small starter set of node, status, and toolbar glyphs used throughout the dashboard kit. All are 24×24, `currentColor` based, 1.5px stroke. They include: `node-input`, `node-logic`, `node-anchor`, `play`, `pause`, `deploy`, `terminal`, `wallet`, `chevron-down`, `chevron-right`, `copy`, `external-link`, `gear`, `search`, `plus`, `dot`, `lock-sealed`, `database`, `link-chain`.
- `assets/illustrations/` — two flat, monochrome line diagrams (`empty-canvas.svg`, `empty-receipt.svg`) for empty states. Same stroke language as the icon set.

### Sourcing
- The brief did not ship an icon set. **Lucide** (`https://unpkg.com/lucide@latest`) is a near-perfect match for the chosen language (1.5–2px stroke, 24×24, square joins) and is used **as a CDN substitute** wherever a glyph is needed beyond the starter set.
  > 🚩 **Substitution flag** — once an official 0G Flow icon set exists, copy it to `assets/icons/` and remove the Lucide dependency from the kits.

### Usage rules
- All icons render in `currentColor` and inherit the surrounding text color. Never set `fill` or `stroke` to a literal hex.
- A node's icon takes the node's accent color (Input → blue, Logic → violet, Anchor → emerald). Toolbar / chrome icons use `--fg-2`. Active selection uses `--fg-1`.
- Icon button hit-area is **always 32×32 minimum**, even when the glyph is 16×16.
- **Status dots** (`.dot.ok`, `.dot.idle`, `.dot.err`) are 8-px circles with the corresponding `--*-glow` halo. Use them, not text, to convey live state.

### Forbidden
- ❌ **Emoji as iconography.** Not in nav, tabs, badges, or empty states. (The reference `brutalist.html` and `console.html` files used emoji — that pattern is rejected here.)
- ❌ **Filled-style icons.** Stroke only.
- ❌ **Multi-color icons.** Each icon is monochrome; if you need to imply two states, use two separate icons.
- ❌ **Hand-drawn / sketch / 3D / isometric** glyphs — all break the "system tool" register.

---

## Index

- **Tokens & primitives:** `colors_and_type.css`
- **Cards (Design System tab):** `preview/*.html` — palette, type scale, radii/shadow, components in isolation.
- **UI kits:**
  - `ui_kits/flow_dashboard/` — full dashboard with Canvas, custom Nodes (Input · Logic · Anchor), Header (Connect Wallet + Deploy), Results Drawer.
- **Agent skill:** `SKILL.md` — entry point if this folder is dropped into Claude Code as an Agent Skill.

---

## Open questions / asks for the user

1. **Real codebase or Figma** — does one exist? Everything below is interpolated from the brief + editorial sample.
2. **Official wordmark** — the `0G` mark used here is a placeholder lockup. Please drop the real SVG into `assets/logos/`.
3. **Icon set** — confirm Lucide as the substitute, or ship the official set.
4. **Galileo testnet branding** — is there an official explorer color or chain badge that should appear on tx hash receipts?
