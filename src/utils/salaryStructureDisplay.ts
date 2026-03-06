export const mapSalaryStructureComponentLabel = (
  input: { component?: any; abbr?: any } | any,
): string => {
  const component = String(input?.component ?? "").trim();
  const abbr = String(input?.abbr ?? "").trim();
  if (!component && !abbr) return "";
  if (component.toLowerCase() === "income tax" || abbr.toUpperCase() === "IT")
    return "PAYE";
  return component || abbr;
};

export const toSalaryStructureMoneyRows = (
  rows: any,
): Array<{ label: string; amount: number }> => {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((r: any) => ({
      label: mapSalaryStructureComponentLabel(r),
      amount: Number(r?.amount ?? 0),
    }))
    .filter((r: any) => Boolean(r.label));
};
