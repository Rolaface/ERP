function required(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const ENV = {
  apiBaseUrl: required("VITE_API_BASE_URL"),
  zraCodesBaseUrl: required("VITE_ZRA_CODES_BASE_URL"),
  napsaBaseUrl: required("VITE_NAPSA_BASE_URL"),
} as const;
