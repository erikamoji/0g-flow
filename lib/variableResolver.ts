export interface StateStore {
  [nodeId: string]: any;
}

export interface ResolveResult {
  resolved: any;
  references: string[];
}

export function resolveVariables(value: any, stateStore: StateStore): ResolveResult {
  const references: string[] = [];

  if (typeof value !== 'string') {
    return { resolved: value, references };
  }

  const refPattern = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = refPattern.exec(value)) !== null) {
    const fullRef = match[0];
    const path = match[1];
    references.push(fullRef);
  }

  const resolved = value.replace(refPattern, (match, path) => {
    const parts = path.split('.');
    const nodeId = parts[0];

    if (!(nodeId in stateStore)) {
      console.warn(`⚠️  Referenced node "${nodeId}" not found in state store`);
      return match;
    }

    let result = stateStore[nodeId];

    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      if (key === 'output') continue;

      if (result === null || result === undefined) {
        console.warn(`⚠️  Cannot access property "${key}" of null/undefined`);
        return match;
      }

      result = result[key];
    }

    if (typeof result === 'object') {
      return JSON.stringify(result);
    }

    return String(result);
  });

  return { resolved, references };
}

export function resolveParametersObject(
  parameters: Record<string, any>,
  stateStore: StateStore
): { resolved: Record<string, any>; references: string[] } {
  const allReferences: string[] = [];
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(parameters)) {
    const result = resolveVariables(value, stateStore);
    resolved[key] = result.resolved;
    allReferences.push(...result.references);
  }

  return { resolved, references: allReferences };
}
