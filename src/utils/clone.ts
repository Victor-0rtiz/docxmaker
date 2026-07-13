export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return manualDeepClone(value) as T;
}

function manualDeepClone(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (value instanceof Uint8Array) {
    return new Uint8Array(value);
  }

  if (value instanceof ArrayBuffer) {
    return value.slice(0);
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return value.slice(0, value.size, value.type);
  }

  if (typeof File !== 'undefined' && value instanceof File) {
    return new File([value], value.name, { type: value.type, lastModified: value.lastModified });
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return Buffer.from(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => manualDeepClone(item));
  }

  if (typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      clone[key] = manualDeepClone((value as Record<string, unknown>)[key]);
    }
    return clone;
  }

  return value;
}
