import { useState, useCallback, useEffect } from "react";
import {
  getCompanyDefaults,
  updateCompanyDefaults,
} from "../api/companySetupApi";
import { showApiError, showSuccessWithWarnings } from "../utils/alert";
import { useDataRefreshStore } from "../store/dataRefreshStore";
import { useCompanyDefaultsStore } from "../store/Companydefaultsstore";

type DefaultValues = Record<string, string>;

export function useCompanyDefaults() {
  const [values, setValues] = useState<DefaultValues>({});
  const [savedValues, setSavedValues] = useState<DefaultValues>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    setError(null);
    try {
      const resp = await getCompanyDefaults();
      const data: DefaultValues = resp?.message?.data || resp?.message || resp || {};
      setValues(data);
      setSavedValues(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load company default settings.");
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
      .subscribeToRefresh("COMPANY_DEFAULTS" as any, () =>
        fetchSettings({ silent: true })
      );
    return unsubscribe;
  }, [fetchSettings]);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

const handleSave = useCallback(async () => {
  const dirty: DefaultValues = {};
  Object.keys(values).forEach((key) => {
    if (values[key] !== savedValues[key]) {
      dirty[key] = values[key];
    }
  });

  if (Object.keys(dirty).length === 0) return;

  const payload: Record<string, string | boolean> = { ...dirty };
  if ("use_separate_sequence_for_credit_notes" in payload) {
    payload.use_separate_sequence_for_credit_notes =
      payload.use_separate_sequence_for_credit_notes === "true";
  }

  setIsSaving(true);
  setError(null);
  try {
    const resp = await updateCompanyDefaults(payload);
    const respData = resp?.message;

    showSuccessWithWarnings(
      respData?.message || "Defaults updated successfully",
      respData?.data?.warnings,
    );

    useDataRefreshStore.getState().triggerRefresh("COMPANY_DEFAULTS" as any);
    useCompanyDefaultsStore.getState().setDefaults(values);
    useCompanyDefaultsStore.getState().fetchDefaults(true);
  } catch (err: any) {
    setError(err?.message);
    showApiError(err);
  } finally {
    setIsSaving(false);
  }
}, [values, savedValues]);

  return { values, isLoading, isSaving, error, handleChange, handleSave };
}