export const r2 = (n: number): number => Math.round(n * 100) / 100;

export const normaliseAmount = (v: unknown): number => r2(Number(v ?? 0));

// Keys with spaces or special characters break new Function() in strict mode,
// so every ctx key and every formula-eval parameter name is checked against
// this before use.
export const isValidIdentifier = (k: string): boolean =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k);