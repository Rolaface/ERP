import { useState, useCallback, useEffect } from "react";
import {
  getNamingSeriesSettings,
  updateNamingSeriesSettings,
} from "../api/NamingSeriesApi";
import { showApiError, showSuccessWithWarnings } from "../utils/alert";
import { useDataRefreshStore, REFRESH_KEYS } from "../store/dataRefreshStore"; 

type SeriesValues = Record<string, string>;

export function useNamingSeries() {
  const [values, setValues]           = useState<SeriesValues>({});
  const [savedValues, setSavedValues] = useState<SeriesValues>({});
  const [isLoading, setIsLoading]     = useState(true);
  const [isSaving, setIsSaving]       = useState(false);
  const [error, setError]             = useState<string | null>(null);


  const fetchSettings = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    setError(null);
    try {
      const resp = await getNamingSeriesSettings();
      const data: SeriesValues = resp?.message?.data ?? {};
      setValues(data);
      setSavedValues(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load naming series settings.");
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.NAMING_SERIES, () =>
        fetchSettings({ silent: true })
      );
    return unsubscribe;
  }, [fetchSettings]);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const dirty: SeriesValues = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== savedValues[key]) {
        dirty[key] = values[key];
      }
    });

    if (Object.keys(dirty).length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      const resp = await updateNamingSeriesSettings(dirty);
      const payload = resp?.message;

      showSuccessWithWarnings(payload?.message, payload?.data?.warnings);

      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.NAMING_SERIES);
    } catch (err: any) {
      setError(err?.message);
      showApiError(err);
    } finally {
      setIsSaving(false);
    }
  }, [values, savedValues]);

  return { values, isLoading, isSaving, error, handleChange, handleSave };
}