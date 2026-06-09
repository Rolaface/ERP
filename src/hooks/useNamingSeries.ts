import { useState, useCallback, useEffect } from "react";
import {
  getNamingSeriesSettings,
  updateNamingSeriesSettings,
} from "../api/NamingSeriesApi";
import { SECTIONS} from "../views/CompanySetup/NamingSeries";

type SeriesValues = Record<string, string>;

function getDefaultValues(): SeriesValues {
  const vals: SeriesValues = {};
  SECTIONS.forEach((s) => s.fields.forEach((f) => { vals[f.key] = f.defaultValue; }));
  return vals;
}

export function useNamingSeries() {
  const [values, setValues]         = useState<SeriesValues>(getDefaultValues);
  const [savedValues, setSavedValues] = useState<SeriesValues>(getDefaultValues);
  const [isLoading, setIsLoading]   = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await getNamingSeriesSettings();
        const data: SeriesValues = resp?.message?.data ?? {};

        // Map API keys → component keys and only override what the API returns
        setValues((prev) => ({ ...prev, ...data }));
        setSavedValues((prev) => ({ ...prev, ...data }));
      } catch (err: any) {
        setError(err?.message ?? "Failed to load naming series settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Save — only dirty fields ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const dirty: SeriesValues = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== savedValues[key]) {
        dirty[key] = values[key];
      }
    });

    if (Object.keys(dirty).length === 0) return; // nothing changed

    setIsSaving(true);
    setError(null);
    try {
      await updateNamingSeriesSettings(dirty);
      setSavedValues({ ...values }); // sync baseline to current
    } catch (err: any) {
      setError(err?.message ?? "Failed to save naming series settings.");
    } finally {
      setIsSaving(false);
    }
  }, [values, savedValues]);

  return {
    values,
    isLoading,
    isSaving,
    error,
    handleChange,
    handleSave,
  };
}