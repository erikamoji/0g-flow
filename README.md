# 0G Flow

Visual workflow builder for verifiable AI on the [0G network](https://0g.ai). Drag nodes onto a canvas, connect them, and deploy a signed manifest that routes inference through 0G Compute (with TEE attestation), stores outputs via `@0gfoundation/0g-ts-sdk`, and anchors provenance on-chain via WorkflowRegistry — all verifiable by workflow ID.

## What it does

- **Drag-and-drop canvas** — build workflows from four node types: data input, AI compute, memory store, storage anchor
- **TEE-attested inference** — compute nodes send `verify_tee: true` to the 0G Router; attestation status is parsed from `x_0g_trace.tee_verified` and shown live in the execution terminal
- **Real 0G Storage** — outputs uploaded via `@0gfoundation/0g-ts-sdk` with merkle tree validation; every upload produces a verifiable `txHash` + `rootHash`
- **On-chain provenance** — `WorkflowRegistry.sol` records every workflow and execution on 0G Chain; anyone can verify by workflow ID
- **Manifest format** — every workflow compiles to a portable JSON spec with `workflow_id`, `chain_id`, node graph, and edge wiring
- **Network-aware** — Galileo testnet (16602) and Aristotle mainnet (16661) with per-network model lists and run history replay

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your wallet, and start building.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OG_ROUTER_API_KEY` | yes | API key from the 0G compute dashboard |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | WalletConnect project ID (falls back to demo mode) |
| `NEXT_PUBLIC_REGISTRY_ADDRESS_16602` | no | WorkflowRegistry on Galileo testnet — `0xC9B54F8437f87D3af6926876d32874f453121b7d` |
| `NEXT_PUBLIC_REGISTRY_ADDRESS_16661` | no | WorkflowRegistry on Aristotle mainnet — `0x2Dade1D970431445d1e9509751015c5F9C7F1F50` |

All RPC endpoints and router URLs are resolved per-chain from `lib/networks.ts` — no manual URL overrides needed. No server private key required; storage and registry writes are signed by the user's connected wallet.

## Node types

| Node | What it does |
|---|---|
| **Data Input** | JSON payload as the workflow trigger |
| **AI Compute** | 0G Router inference with optional TEE attestation (`sealed: true`) |
| **Memory Store** | Read/write persistent memory via 0G Storage. Write: wallet-signed upload. Read: fetch by root hash, inject into downstream nodes |
| **Storage Anchor** | Upload result to 0G Storage; returns `txHash` + `rootHash` + explorer link |

Chain node outputs with `{{nodeId.output.field}}` in any parameter.

## Networks

| Network | Chain ID | Router | Registry |
|---|---|---|---|
| Galileo Testnet | 16602 | `router-api-testnet.integratenetwork.work/v1` | `0xC9B54F8437f87D3af6926876d32874f453121b7d` |
| Aristotle Mainnet | 16661 | `router-api.0g.ai/v1` | `0x2Dade1D970431445d1e9509751015c5F9C7F1F50` |

**Mainnet models:** `zai-org/GLM-5.1-FP8`, `deepseek-v4-pro`, `0GM-1.0-35B-A3B`, `qwen/qwen3-vl-30b-a3b-instruct`
**Testnet models:** `qwen/qwen-2.5-7b-instruct`

## Verifying a workflow

After execution, open the **Verify** tab in the execution drawer, paste the `workflow_id`, and hit Verify. The registry returns:
- `manifestHash` — keccak256 of the compiled manifest
- `storageKey` — 0G Storage root hash of the output
- `executionCount` — total runs recorded on-chain
- `execTxHash` — 0G explorer link for the latest execution

Both registry contracts are deployed and live. Verification works on testnet and mainnet.

## TEE attestation

Compute nodes with `sealed: true` send `verify_tee: true` to the 0G Router API. The response `x_0g_trace.tee_verified` field indicates whether the inference ran inside a TEE enclave. A green `TEE ✓` or red `TEE ✗` badge appears inline in the execution log. The `ZG-Res-Key` response header (`og_chat_id` in the result) enables independent verification via `broker.inference.processResponse(providerAddress, chatID)` from `@0gfoundation/0g-compute-ts-sdk`.

## Run a manifest locally

```bash
npm run execute manifests/example-vm0048.json
```

Requires `.env` with `OG_RPC_URL`. See [EXECUTOR.md](./EXECUTOR.md) for full docs.

## Stack

- Next.js 15 + React 19
- ReactFlow (canvas)
- RainbowKit + Wagmi (wallet)
- `@0gfoundation/0g-ts-sdk` (storage)
- Viem (registry contract reads/writes)
- Tailwind v4

## Architecture

```
L1  Compute       0G Router API + verify_tee
L2  Storage/DA    @0gfoundation/0g-ts-sdk (merkle tree)
L3  Settlement    WorkflowRegistry.sol on 0G Chain (testnet + mainnet)
L4  Identity      Wagmi + RainbowKit (chain-aware)
L5  Inference     ManifestExecutor + variableResolver
L6  Protocol      Manifest schema (workflow_id, chain_id, nodes[], edges[])
L7  Application   Canvas, templates, 4-tab Drawer, run history
```
