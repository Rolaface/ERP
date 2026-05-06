import { useState, useCallback } from "react";
import {
  createAssetMovement,
  updateAssetMovement,
} from "../api/assetMovementapi";
import { showValidationError, showApiError } from "../utils/alert";
import type { AssetMovementRecord } from "../types/Assetmovement.types";
import {
  AssetMovementForm,
  AssetMovementRow,
  DEFAULT_ASSET_MOVEMENT_FORM,
  DEFAULT_ASSET_MOVEMENT_ROW,
} from "../types/Assetmovement.types";
import {
  checkLocationExists as checkLocationExistsApi,
  createLocation,
} from "../api/location";

/* ─────────────────────────────────────────────
   PAYLOAD TYPES  (snake_case — matches server contract)
───────────────────────────────────────────── */

interface AssetRowPayload {
  asset: string;
  source_location?: string;
  source_employee?: string;
  target_location?: string;
  target_employee?: string;
}

interface AssetMovementPayload {
  company?: string;
  purpose: string;
  transaction_date: string;
  reference_number?: string;
  reference_date?: string;
  assets: AssetRowPayload[];
}

/* ─────────────────────────────────────────────
   PAYLOAD BUILDERS
   Maps camelCase UI form → snake_case server contract.
   Only includes optional fields when they have a non-empty
   value so the server never receives empty strings.
───────────────────────────────────────────── */

function buildRowPayload(row: AssetMovementRow): AssetRowPayload {
  const payload: AssetRowPayload = {
    asset: row.asset,
  };

  if (row.sourceLocation?.trim())
    payload.source_location = row.sourceLocation.trim();
  if (row.fromEmployee?.trim())
    payload.source_employee = row.fromEmployee.trim();
  if (row.targetLocation?.trim())
    payload.target_location = row.targetLocation.trim();
  if (row.toEmployee?.trim()) payload.target_employee = row.toEmployee.trim();

  return payload;
}

function buildPayload(form: AssetMovementForm): AssetMovementPayload {
  const payload: AssetMovementPayload = {
    purpose: form.purpose,
    // transaction_date must be YYYY-MM-DD; slice ISO string if needed
    transaction_date:
      form.transactionDate.length > 10
        ? form.transactionDate.slice(0, 10)
        : form.transactionDate,
    assets: form.assets.map(buildRowPayload),
  };

  if (form.company?.trim()) payload.company = form.company.trim();
  if (form.referenceNumber?.trim())
    payload.reference_number = form.referenceNumber.trim();
  if (form.referenceDate?.trim())
    payload.reference_date = form.referenceDate.trim();

  return payload;
}

//resolver for location
const resolveLocation = async (location: string) => {
  const trimmed = (location || "").trim();
  if (!trimmed) return "";

  const existing = await checkLocationExistsApi(trimmed);

  if (existing) return existing;

  const response = await createLocation(trimmed);
  return response?.data?.name ?? trimmed;
};
/* ─────────────────────────────────────────────
   HOOK OPTIONS
───────────────────────────────────────────── */

interface UseAssetMovementOptions {
  /** When provided the hook operates in edit mode */
  recordId?: string;
  initialData?: Partial<AssetMovementForm>;
  onSuccess?: (record: AssetMovementRecord) => void | Promise<void>;
}

/* ─────────────────────────────────────────────
   HOOK
───────────────────────────────────────────── */

export function useAssetMovement(options: UseAssetMovementOptions = {}) {
  const { recordId, initialData, onSuccess } = options;

  /* ── Build initial form from defaults + any initialData ── */
  const buildInitialForm = useCallback(
    (): AssetMovementForm => ({
      ...DEFAULT_ASSET_MOVEMENT_FORM,
      ...initialData,
      transactionDate: initialData?.transactionDate ?? new Date().toISOString(),
      assets: initialData?.assets?.length
        ? initialData.assets
        : [{ ...DEFAULT_ASSET_MOVEMENT_ROW, id: crypto.randomUUID() }],
    }),
    [initialData],
  );

  const [form, setForm] = useState<AssetMovementForm>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─────────────────────────────────────────
     FORM HELPERS
  ───────────────────────────────────────── */

  /** Reset form back to initial / default state */
  const resetForm = useCallback(() => {
    setError(null);
    setForm(buildInitialForm());
  }, [buildInitialForm]);

  /** Update any top-level field by name + value */
  const handleFieldChange = useCallback((name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  /** React synthetic-event handler — for ModalInput / ModalSelect */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChange(e.target.name, e.target.value);
    },
    [handleFieldChange],
  );

  /* ─────────────────────────────────────────
     ROW HELPERS
  ───────────────────────────────────────── */

  const addRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        { ...DEFAULT_ASSET_MOVEMENT_ROW, id: crypto.randomUUID() },
      ],
    }));
  }, []);

  const updateRow = useCallback(
    (id: string, key: keyof AssetMovementRow, value: string) => {
      setForm((prev) => ({
        ...prev,
        assets: prev.assets.map((r) =>
          r.id === id ? { ...r, [key]: value } : r,
        ),
      }));
    },
    [],
  );

  const removeRow = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.filter((r) => r.id !== id),
    }));
  }, []);

  /* ─────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────── */

  function validate(f: AssetMovementForm): string | null {
    if (!f.purpose) return "Purpose is required.";
    if (!f.transactionDate) return "Transaction date is required.";
    if (!f.assets.length) return "At least one asset row is required.";
    for (const row of f.assets) {
  if (!row.asset.trim()) {
    return "Asset name is required for all rows.";
  }
  if (
    row.sourceLocation &&
    row.targetLocation &&
    row.sourceLocation.trim().toLowerCase() ===
      row.targetLocation.trim().toLowerCase()
  ) {
    return `Source and Target location cannot be same for asset ${row.asset || ""}`;
  }
}
    return null;
  }

  /* ─────────────────────────────────────────
     SUBMIT
     Delegates to the centralized API service.
     buildPayload() converts the UI form to the
     snake_case server contract here in the hook
     so the API service stays generic.
  ───────────────────────────────────────── */

  const submitForm = useCallback(async (): Promise<boolean> => {
    const validationError = validate(form);
  if (validationError) {
  showValidationError(validationError);
  return false;
}

    setSubmitting(true);
    setError(null);

    try {
      for (const row of form.assets) {
        if (row.sourceLocation) {
          row.sourceLocation = await resolveLocation(row.sourceLocation);
        }

        if (row.targetLocation) {
          row.targetLocation = await resolveLocation(row.targetLocation);
        }
      }
      const payload = buildPayload(form);

      const record: AssetMovementRecord = recordId
        ? await updateAssetMovement(recordId, payload)
        : await createAssetMovement(payload);

      await onSuccess?.(record);
      return true;
    } catch (err) {
  showApiError(err);
  return false;
} finally {
      setSubmitting(false);
    }
  }, [form, recordId, onSuccess]);

  /* ─────────────────────────────────────────
     EXPOSED API
  ───────────────────────────────────────── */

  return {
    form,
    submitting,
    error,
    setForm,
    resetForm,
    handleChange,
    handleFieldChange,
    addRow,
    updateRow,
    removeRow,
    submitForm,
  };
}
