export type NodeType = 'trigger' | '0g_inference' | '0g_storage_write';

export const NODE_TYPES = {
  trigger: {
    label: 'Trigger',
    description: 'Starting point - mock data payload',
    icon: '▶',
  },
  '0g_inference': {
    label: '0G Inference',
    description: 'AI model inference via 0G compute',
    icon: '⚡',
  },
  '0g_storage_write': {
    label: '0G Storage',
    description: 'Anchor to 0G decentralized storage',
    icon: '💾',
  },
};
