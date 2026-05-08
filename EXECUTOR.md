# 0G Flow Manifest Executor

Local TypeScript executor for 0G Flow workflows. Takes a compiled JSON manifest and executes it against 0G's decentralized infrastructure.

## Usage

### Quick Start

1. Export a manifest from the UI (Deploy button → Download)
2. Run the executor:

```bash
npm run execute manifests/my-workflow.json
```

### Example

```bash
npm run execute manifests/example-vm0048.json
```

## Workflow Execution

The executor handles three node types:

### Trigger Nodes
- **Purpose**: Provide initial data to the workflow
- **Parameters**: `mock_payload` (JSON string)
- **Output**: Parsed JSON object

### 0G Inference Nodes
- **Purpose**: Run AI model inference via 0G Compute
- **Parameters**:
  - `model_id`: Model identifier (e.g., `qwen-2.5-7b-instruct`)
  - `system_prompt`: System instruction for the model
  - `input_ref`: Reference to upstream node output (e.g., `{{node_trigger.output}}`)
- **Output**: Object with `reasoning`, `model`, `input`, `timestamp`
- **API**: Calls `https://router-api.0g.ai/v1/chat/completions`

### Storage Nodes
- **Purpose**: Anchor workflow results to 0G's decentralized storage
- **Parameters**:
  - `value_ref`: Reference to data to store (e.g., `{{node_compute.output.reasoning}}`)
- **Output**: Object with `transactionHash`, `storedValue`, `timestamp`, `network`
- **Network**: 0G Galileo Testnet

## Parameter References

Nodes can reference outputs from previous nodes using template syntax:

```
{{node_id.output.field}}
```

Example:
```json
{
  "type": "0g_inference",
  "parameters": {
    "input_ref": "{{node_trigger.output}}"
  }
}
```

The executor:
1. Topologically sorts nodes by edges
2. Executes in dependency order
3. Resolves references to previous node outputs
4. Propagates results through the workflow

## Results

After execution, results are saved to a timestamped JSON file:

```
results-wf_1234567890.json
```

Contains the full execution context with all node outputs.

## Environment Variables

Optional configuration in `.env`:

```
OG_RPC_URL=https://test-rpc.0g.ai
OG_ROUTER_API=https://router-api.0g.ai/v1
PRIVATE_KEY=0x...          # For real storage writes
WALLET_ADDRESS=0x...       # For real storage writes
```

## Error Handling

The executor will:
- Validate manifest structure
- Detect circular dependencies
- Log detailed errors for API failures
- Exit with code 1 on failure

## Demo: VM0048 Carbon MRV

The included `manifests/example-vm0048.json` demonstrates:

1. **Trigger**: Provides environmental sensor data
2. **Inference**: Validates data against VM0048 carbon methodology
3. **Storage**: Anchors verified results to 0G network

Run:
```bash
npm run execute manifests/example-vm0048.json
```
