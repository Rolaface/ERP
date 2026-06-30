import React, { useEffect, useState } from "react";
import TermsAndCondition from "../../components/TermsAndCondition";
import { RotateCcw, Save } from "lucide-react";

import type { Terms, TermSection } from "../../types/termsAndCondition";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { updateCompanyById } from "../../api/companySetupApi";
import { fireManagedSwal } from "../../utils/swalManager";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface BuyingSellingProps {
  terms?: Terms | null;
  onSaveSuccess?: () => void;
  setUnsavedFields: (fields: string[]) => void;
}

const normalizeSection = (section?: TermSection): TermSection => ({
  general: section?.general ?? "",
  delivery: section?.delivery ?? "",
  cancellation: section?.cancellation ?? "",
  warranty: section?.warranty ?? "",
  liability: section?.liability ?? "",
  payment: {
    phases: section?.payment?.phases ?? [],
    dueDates: section?.payment?.dueDates ?? "",
    lateCharges: section?.payment?.lateCharges ?? "",
    taxes: section?.payment?.taxes ?? "",
    notes: section?.payment?.notes ?? "",
  },
});

const emptySection = (): TermSection => ({
  general: "",
  delivery: "",
  cancellation: "",
  warranty: "",
  liability: "",
  payment: {
    phases: [],
    dueDates: "",
    lateCharges: "",
    taxes: "",
    notes: "",
  },
});

// Read a CSS variable value at runtime (for use in JS contexts like SweetAlert)
const getCssVar = (varName: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(varName).trim() ||
  fallback;

const BuyingSelling: React.FC<BuyingSellingProps> = ({
  terms,
  onSaveSuccess,
  setUnsavedFields,
}) => {
  const [formData, setFormData] = useState({
    buying: emptySection(),
    selling: emptySection(),
  });

  // Add this new useEffect
  useEffect(() => {
    if (!terms) return;

    const changedFields: string[] = [];

    const originalBuying = JSON.stringify(normalizeSection(terms.buying));
    const currentBuying = JSON.stringify(formData.buying);
    if (originalBuying !== currentBuying) {
      changedFields.push("Buying Terms");
    }

    const originalSelling = JSON.stringify(normalizeSection(terms.selling));
    const currentSelling = JSON.stringify(formData.selling);
    if (originalSelling !== currentSelling) {
      changedFields.push("Selling Terms");
    }

    setUnsavedFields(changedFields);
  }, [formData, terms, setUnsavedFields]);

  const hasChanges = React.useMemo(() => {
    if (!terms) return false;
    const original = JSON.stringify({
      buying: normalizeSection(terms.buying),
      selling: normalizeSection(terms.selling),
    });
    const current = JSON.stringify(formData);
    return original !== current;
  }, [formData, terms]);

  useEffect(() => {
    if (!terms) return;
    setFormData({
      buying: normalizeSection(terms.buying),
      selling: normalizeSection(terms.selling),
    });
  }, [terms]);

  const handleReset = () => {
    if (!terms) return;
    setFormData({
      buying: normalizeSection(terms.buying),
      selling: normalizeSection(terms.selling),
    });
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      fireManagedSwal({
        icon: "info",
        title: "No Changes",
        text: "No changes to save.",
      });
      return;
    }

    const confirm = await fireManagedSwal({
      title: "Save Terms?",
      text: "Do you want to update company terms and conditions?",
      icon: "question",
      showCancelButton: true,
      // Read theme-aware colors at call time so they match current theme
      confirmButtonColor: getCssVar("--success", "#22c55e"),
      cancelButtonColor: getCssVar("--danger", "#dc2626"),
      confirmButtonText: "Yes, Save",
    });

    if (!confirm.isConfirmed) return;

    const payload = {
      id: COMPANY_ID,
      terms: formData,
    };

    try {
      showLoading("Saving Terms...");
      await updateCompanyById(payload);
      closeSwal();
      onSaveSuccess && onSaveSuccess();
      showSuccess("Terms saved successfully!");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  return (
    <div className="bg-app">
      {/*
        xs/sm  → single column (full width each)
        lg+    → side by side (panels are wide enough to be useful)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <TermsAndCondition
          title="Buying Terms & Conditions"
          terms={formData.buying}
          setTerms={(updated) =>
            setFormData((prev) => ({ ...prev, buying: updated }))
          }
        />

        <TermsAndCondition
          title="Selling Terms & Conditions"
          terms={formData.selling}
          setTerms={(updated) =>
            setFormData((prev) => ({ ...prev, selling: updated }))
          }
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-3 mt-4 pt-4 border-t border-theme sm:mt-6 sm:pt-0 sm:border-none">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges}
          title={!hasChanges ? "Nothing to reset" : "Reset to saved values"}
          className={`flex items-center gap-2 px-4 py-2 border border-theme rounded-lg bg-card text-sm transition-opacity
            ${hasChanges ? "text-muted hover:opacity-80" : "text-muted opacity-40 cursor-not-allowed"}`}
        >
          <RotateCcw size={14} />
          Reset
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasChanges}
          title={!hasChanges ? "No changes to save" : "Save terms"}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium transition-opacity bg-primary
            ${hasChanges ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"}`}
        >
          <Save size={14} />
          Save Terms
        </button>
      </div>
    </div>
  );
};

export default BuyingSelling;