# 0G Flow

> Visual drag-and-drop workflow builder that routes AI inference through 0G Compute, stores outputs on 0G Storage, and anchors provenance on 0G Chain.

**[Live Demo](https://0g-flow.vercel.app/)** · **[Slide Deck](https://0g-flow-deck.netlify.app)** · **[Demo Video](https://www.youtube.com/watch?v=3L0ygEANUPI)**

---

## 0G Integration — Required Submission Details

| | |
|---|---|
| **Mainnet contract** | `0x2Dade1D970431445d1e9509751015c5F9C7F1F50` (WorkflowRegistry, Aristotle Mainnet 16661) |
| **Testnet contract** | `0xC9B54F8437f87D3af6926876d32874f453121b7d` (WorkflowRegistry, Galileo Testnet 16602) |
| **0G Explorer (mainnet)** | https://explorer.0g.ai/address/0x2Dade1D970431445d1e9509751015c5F9C7F1F50 |
| **0G Explorer (testnet)** | https://chainscan-galileo.0g.ai/address/0xC9B54F8437f87D3af6926876d32874f453121b7d |
| **0G components used** | 0G Compute (Router API + TEE attestation), 0G Storage (`@0gfoundation/0g-ts-sdk`), 0G Chain (WorkflowRegistry contract) |

Every workflow execution writes two on-chain records: a `WorkflowRegistered` event (keccak256 manifest hash + storage root hash) and an `ExecutionRecorded` event — both verifiable on the 0G Explorer by contract address or workflow ID.

---

## What it does

0G Flow is a visual workflow builder for verifiable AI on the [0G network](https://0g.ai). Users drag nodes onto a canvas, connect them, and deploy a signed manifest that:

1. Routes inference through the **0G Compute Router** with optional TEE attestation
2. Uploads outputs to **0G Storage** via merkle-tree-validated SDK transactions
3. Records a tamper-proof provenance receipt in **WorkflowRegistry.sol** on **0G Chain**

Every execution produces a `txHash`, a `rootHash`, and an on-chain `executionCount` — all verifiable by workflow ID without trusting the application.

## Problem it solves

AI pipelines today are opaque: you can't prove which model ran, on what input, or that the output wasn't altered before it was stored. 0G Flow makes every step of a multi-model workflow **verifiable on-chain** — the manifest hash, the inference attestation, and the storage receipt are all anchored to 0G Chain in a single execution flow that anyone can audit.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  Canvas (ReactFlow) → Manifest compiler → Deploy modal      │
│  RainbowKit wallet (chain-aware: 16602 / 16661)             │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/execute
┌────────────────────▼────────────────────────────────────────┐
│                   Next.js API Route                         │
│  ManifestExecutor → topological sort → variableResolver     │
└──────┬──────────────────────┬───────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼────────────────────────────────┐
│  0G Compute │    │            0G Storage                     │
│  Router API │    │  @0gfoundation/0g-ts-sdk                  │
│  verify_tee │    │  merkle tree upload → txHash + rootHash   │
│  → response │    └──────────────────────┬────────────────────┘
└─────────────┘                           │
                               ┌──────────▼────────────────────┐
                               │         0G Chain              │
                               │  WorkflowRegistry.sol         │
                               │  registerWorkflow()           │
                               │  recordExecution()            │
                               │  → WorkflowRegistered event   │
                               │  → ExecutionRecorded event    │
                               └───────────────────────────────┘
```

### Layer map

| Layer | Component | 0G integration |
|---|---|---|
| Compute | 0G Router API | `verify_tee: true` → TEE attestation |
| Storage/DA | `@0gfoundation/0g-ts-sdk` | Merkle tree upload, `txHash` + `rootHash` |
| Settlement | `WorkflowRegistry.sol` | `registerWorkflow`, `recordExecution` on-chain |
| Identity | Wagmi + RainbowKit | Chain-aware (Galileo 16602 / Aristotle 16661) |
| Execution | `ManifestExecutor` + `variableResolver` | Template reference resolution across nodes |
| Protocol | Manifest schema | `workflow_id`, `chain_id`, `nodes[]`, `edges[]` |
| Application | Canvas, 4-tab Drawer, run history | — |

---

## 0G Modules — How Each One Is Used

### 0G Compute (Router API + TEE)

Compute nodes send structured chat completions to the 0G Router. With `sealed: true`, the request includes `verify_tee: true` — the router returns `x_0g_trace.tee_verified` indicating whether inference ran inside a TEE enclave. The `ZG-Res-Key` / `og_chat_id` header enables independent verification via `broker.inference.processResponse(providerAddress, chatID)` from `@0gfoundation/0g-compute-ts-sdk`. A green `TEE ✓` or red `TEE ✗` badge appears inline in the execution log.

**Mainnet models:** `zai-org/GLM-5.1-FP8`, `deepseek-v4-pro`, `0GM-1.0-35B-A3B`, `qwen/qwen3-vl-30b-a3b-instruct`
**Testnet models:** `qwen/qwen-2.5-7b-instruct`

### 0G Storage (`@0gfoundation/0g-ts-sdk`)

Storage Anchor and Memory Store nodes upload data via the 0G TypeScript SDK. Each upload goes through the SDK's merkle tree validation pipeline and returns a `txHash` and `rootHash`. The explorer link is constructed from the network's `storageExplorer` base URL. Storage writes are signed by the user's connected wallet — no server private key required.

### 0G Chain (WorkflowRegistry.sol)

`WorkflowRegistry.sol` is deployed on both networks. On each execution:
- `registerWorkflow(workflowId, manifestHash, storageKey)` — records the keccak256 hash of the compiled manifest and the storage root hash
- `recordExecution(workflowId, executionTxHash, storageTxHash)` — appends an execution record and increments `executionCount`

Both calls emit indexed events visible on the 0G Explorer. The **Verify** tab in the execution drawer calls `getWorkflow` and `getLatestExecution` to surface this data in-app.

---

## Node Types

| Node | Role |
|---|---|
| **Data Input** | JSON payload as the workflow trigger |
| **AI Compute** | 0G Router inference with optional TEE attestation (`sealed: true`) |
| **Memory Store** | Read/write persistent memory via 0G Storage — wallet-signed upload on write, hash-based fetch on read |
| **Storage Anchor** | Upload result to 0G Storage; returns `txHash` + `rootHash` + explorer link |

Chain node outputs with `{{nodeId.output.field}}` in any downstream parameter.

---

## Networks

| Network | Chain ID | Router | Registry |
|---|---|---|---|
| Galileo Testnet | 16602 | `router-api-testnet.integratenetwork.work/v1` | `0xC9B54F8437f87D3af6926876d32874f453121b7d` |
| Aristotle Mainnet | 16661 | `router-api.0g.ai/v1` | `0x2Dade1D970431445d1e9509751015c5F9C7F1F50` |

---

## Quick Start (Local Deployment)

```bash
git clone https://github.com/erikamoji/0g-flow
cd 0g-flow
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — 0G Compute API key from https://dashboard.0g.ai
OG_ROUTER_API_KEY=your_key_here

# Optional — WalletConnect (app works in demo mode without it)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# WorkflowRegistry addresses — defaults already set
NEXT_PUBLIC_REGISTRY_ADDRESS_16602=0xC9B54F8437f87D3af6926876d32874f453121b7d
NEXT_PUBLIC_REGISTRY_ADDRESS_16661=0x2Dade1D970431445d1e9509751015c5F9C7F1F50
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your wallet, and build a workflow.

---

## For Judges — Test Account & Faucet

**Testnet (Galileo, Chain ID 16602) — recommended for review:**

1. Add Galileo Testnet to MetaMask:
   - RPC: `https://evmrpc-testnet.0g.ai`
   - Chain ID: `16602`
   - Symbol: `A0G`
   - Explorer: `https://chainscan-galileo.0g.ai`
2. Get testnet A0G: https://faucet.0g.ai (connect wallet, request tokens)
3. Connect wallet on 0G Flow — the app auto-detects the network and switches

**Mainnet (Aristotle, Chain ID 16661):**

- RPC: `https://evmrpc.0g.ai`
- Chain ID: `16661`
- Symbol: `A0G`
- Explorer: `https://explorer.0g.ai`
- WorkflowRegistry: `0x2Dade1D970431445d1e9509751015c5F9C7F1F50`

**Verifying a workflow on-chain:**
1. Run any workflow in the app
2. Open the **Verify** tab in the execution drawer
3. The workflow ID is pre-filled — hit **Verify**
4. The app reads `manifestHash`, `storageKey`, `executionCount`, and the latest `execTxHash` directly from the registry contract and links to the 0G Explorer

To verify independently: call `getWorkflow(ownerAddress, workflowId)` on the registry contract via the 0G Explorer's Read Contract interface.

---

## Run a Manifest Locally (Without Browser)

```bash
npm run execute manifests/example-vm0048.json
```

Requires `.env` with `OG_RPC_URL`. See [EXECUTOR.md](./EXECUTOR.md) for full docs.

The included `example-vm0048.json` demonstrates a carbon MRV workflow: data input → 0G inference validation → 0G Storage anchor.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OG_ROUTER_API_KEY` | yes | API key from the 0G compute dashboard |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | WalletConnect project ID (falls back to demo mode) |
| `NEXT_PUBLIC_REGISTRY_ADDRESS_16602` | no | WorkflowRegistry on Galileo — default: `0xC9B54F8437f87D3af6926876d32874f453121b7d` |
| `NEXT_PUBLIC_REGISTRY_ADDRESS_16661` | no | WorkflowRegistry on Aristotle — default: `0x2Dade1D970431445d1e9509751015c5F9C7F1F50` |

All RPC endpoints and router URLs resolve per-chain from `lib/networks.ts`. No server private key required — storage and registry writes are signed by the user's connected wallet.

---

## Stack

- Next.js 15 + React 19
- ReactFlow (canvas)
- RainbowKit + Wagmi (wallet, chain-aware)
- `@0gfoundation/0g-ts-sdk` (storage)
- Viem (registry contract reads/writes)
- Tailwind v4
- Hardhat (contract deployment)
