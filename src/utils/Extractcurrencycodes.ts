
export function extractCurrencyCodesFlat(
  records: { currency?: string | null }[],
): string[] {
  const codes = new Set<string>();
  for (const record of records) {
    const code = record.currency?.trim();
    if (code) codes.add(code);
  }
  return [...codes];
}

/** Extracts unique currency codes from a nested tree of records. */
export function extractCurrencyCodesTree<T extends Record<string, any>>(
  nodes: T[] | null | undefined,
  currencyField: keyof T,
  childrenField: keyof T = "children" as keyof T,
): string[] {
  if (!nodes?.length) return [];

  const codes = new Set<string>();

  const walk = (list: T[]) => {
    for (const node of list) {
      const value = node[currencyField];
      if (typeof value === "string" && value.trim()) codes.add(value.trim());

      const children = node[childrenField];
      if (Array.isArray(children) && children.length) walk(children);
    }
  };

  walk(nodes);
  return [...codes];
}