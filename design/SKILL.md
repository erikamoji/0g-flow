---
name: 0g-flow-design
description: Use this skill to generate well-branded interfaces and assets for 0G Flow — the decentralized operating system for AI agents — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the dark "system-architect" dashboard, custom React Flow-style nodes (Input · Logic · Anchor), the Connect Wallet/Deploy header, and the Job Receipt drawer.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. The kit at `ui_kits/flow_dashboard/` is a live click-through — open `index.html` to see how the canvas, nodes, header, and drawer compose.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The single source of truth for tokens is `colors_and_type.css`; never invent new colors or radii — pull them from there.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface, fidelity, scope), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key things to remember when designing for 0G Flow:
- **Dark by default** — no light theme. Always start from `--bg-0`.
- **Three modular neons are semantic, not decorative** — Blue is Input/data, Violet is Logic/compute, Emerald is Anchor/storage. Never swap them.
- **Inter Tight + JetBrains Mono.** Anything that is data (hashes, ids, gas, durations) is mono. No serifs.
- **No emoji in product UI**, ever. Use the icon set in `assets/icons/` (1.5 px stroke, 24 × 24).
- **Status uses dots, not text.** Pair with a short caps-mono label.
- **Verbs:** Compose · Deploy · Anchor — these are the spine of the product copy.
