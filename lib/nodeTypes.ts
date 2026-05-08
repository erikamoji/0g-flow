export type NodeType = 'data_input' | 'ai_compute' | 'storage_anchor';

export const NODE_TYPES = {
  data_input: {
    label: 'Input',
    description: 'Define initial data source',
    icon: '📥',
    color: 'border-blue-400',
  },
  ai_compute: {
    label: 'Logic',
    description: 'AI model computation via 0G',
    icon: '🧠',
    color: 'border-violet-500',
  },
  storage_anchor: {
    label: 'Anchor',
    description: 'Persist output to 0G storage',
    icon: '📌',
    color: 'border-emerald-400',
  },
};
