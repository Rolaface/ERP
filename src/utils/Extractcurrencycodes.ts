
export function extractCurrencyCodesFlat(
  records: { currency?: string | null }[],
): string[] {
  return [
    ...new Set(
      records
        .map((r) => r.currency)
        .filter((c): c is string => !!c && c.trim() !== ""),
    ),
  ];
}


export function extractCurrencyCodesTree<T extends Record<string, any>>(
  nodes: T[] | null | undefined,
  currencyField: keyof T,
  childrenField: keyof T = "children" as keyof T,
): string[] {
  if (!nodes?.length) return [];
  const codes = new Set<string>();

  const walk = (list: T[]) => {
    for (const node of list) {
      const val = node[currencyField];
      if (val && typeof val === "string") codes.add(val.trim());
      const children = node[childrenField];
      if (Array.isArray(children) && children.length) walk(children);
    }
  };

  walk(nodes);
  return [...codes];
}