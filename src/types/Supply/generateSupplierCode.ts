export const generateSupplierCode = (
  supplierName: string,
  existingCodes: string[] = []
): string => {

  if (!supplierName) return "";

  const base = supplierName
    .trim()
    .split(" ")[0]
    .substring(0, 5)
    .toUpperCase();

  const relatedCodes = existingCodes
    .filter(c => c?.startsWith(base))
    .map(c => Number(c.replace(base, "")))
    .filter(n => !isNaN(n));

  const nextNumber = relatedCodes.length
    ? Math.max(...relatedCodes) + 1
    : 1;

  return `${base}${String(nextNumber).padStart(2, "0")}`;
};