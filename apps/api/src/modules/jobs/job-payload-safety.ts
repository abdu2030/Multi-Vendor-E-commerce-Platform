const sensitiveKeyPattern = /(access|refresh|reset|jwt|bearer|authorization|cookie|password|secret|token|api[_-]?key|private[_-]?key|session)/i;

export function assertSafeJobPayload(payload: unknown) {
  const unsafePath = findSensitivePayloadPath(payload);

  if (unsafePath) {
    throw new Error(`Job payload must not include sensitive field: ${unsafePath}.`);
  }
}

function findSensitivePayloadPath(value: unknown, path = "payload", seen = new WeakSet<object>()): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findSensitivePayloadPath(value[index], `${path}[${index}]`, seen);

      if (nestedPath) {
        return nestedPath;
      }
    }

    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;

    if (sensitiveKeyPattern.test(key)) {
      return nextPath;
    }

    const nestedPath = findSensitivePayloadPath(nestedValue, nextPath, seen);

    if (nestedPath) {
      return nestedPath;
    }
  }

  return null;
}
