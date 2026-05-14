# 0G Flow

Visual workflow builder for decentralized AI on the [0G network](https://0g.ai). Drag nodes onto a canvas, wire them together, and deploy a signed manifest that runs inference on 0G Compute and anchors results to 0G Storage — all on-chain.

## What it does

- **Drag-and-drop canvas** — build workflows from four node types: data input, AI compute, memory store, storage anchor
- **Real 0G Compute** — inference calls go to the 0G Router API (Qwen on Galileo testnet)
- **Real 0G Storage** — outputs are uploaded via `@0glabs/0g-ts-sdk` and produce verifiable tx hashes on 0G Galileo Testnet
- **Manifest format** — every workflow compiles to a portable JSON spec you can download, share, or re-execute locally

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your wallet (0G Galileo Testnet, chain ID 16602), and start building.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OG_ROUTER_API` | no | `https://router-api-testnet.integratenetwork.work/v1` | 0G Compute router (testnet). Set to `https://router-api.0g.ai/v1` for mainnet |
| `OG_ROUTER_API_KEY` | yes | — | API key from the 0G dashboard |
| `OG_RPC_URL` | no | `https://evmrpc-testnet.0g.ai` | 0G EVM RPC (server-side) |
| `NEXT_PUBLIC_OG_RPC_URL` | no | `https://evmrpc-testnet.0g.ai` | 0G EVM RPC (browser — storage) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | `demo-project-id` | WalletConnect project ID |

No server private key needed. Storage and memory nodes are signed by the user's connected wallet — they pay their own gas.

## Node types

| Node | What it does |
|---|---|
| **Data Input** | Provides a JSON payload as the workflow trigger |
| **AI Compute** | Sends data to 0G Compute for model inference |
| **Memory Store** | Read/write persistent memory via 0G Storage. Write mode queues a wallet-signed upload; read mode fetches by root hash and injects the result into downstream nodes |
| **Storage Anchor** | Uploads the result to 0G Storage; returns a real `txHash` + `rootHash` |

Reference upstream outputs with `{{nodeId.output.field}}` in any parameter.

## Run a manifest locally

```bash
npm run execute manifests/example-vm0048.json
```

Requires `.env` with `OG_RPC_URL`. See [EXECUTOR.md](./EXECUTOR.md) for full docs.

## Stack

- Next.js 16 + React 19
- ReactFlow (canvas)
- RainbowKit + Wagmi (wallet)
- `@0glabs/0g-ts-sdk` (storage)
- Tailwind v4

## Verifying on-chain

After a workflow runs, each storage or memory node logs an `explorer` URL pointing to `storagescan-galileo.0g.ai`. Paste the `txHash` into the explorer to confirm the upload.

## Roadmap / TODO

- **Image editing node** (`image_edit` type) — `qwen/qwen-image-edit-2511` on Galileo testnet uses an async API (`POST /v1/async/images/edits` → poll `/v1/async/jobs/<JOB_ID>`) with multipart/form-data and actual image file input. Requires a separate node type, file upload UI, and polling executor path.
