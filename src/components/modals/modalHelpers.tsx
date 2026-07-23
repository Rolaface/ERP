export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getInitialData = <T,>(value: unknown): T | null =>
  isRecord(value) ? (value as T) : null;

export const getRecordInitialData = (
  value: unknown,
): Record<string, unknown> | null => (isRecord(value) ? value : null);

export const getModalSeedValue = (
  value: unknown,
  key: string,
): string | number | undefined => {
  if (!isRecord(value)) return undefined;
  const seedValue = value[key];
  return typeof seedValue === "string" || typeof seedValue === "number"
    ? seedValue
    : undefined;
};

export const toQuickAddText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export const modalFallback = (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);