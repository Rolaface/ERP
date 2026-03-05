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
import Swal from "sweetalert2";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface BuyingSellingProps {
  terms?: Terms | null;
  onSaveSuccess?: () => void;
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

const BuyingSelling: React.FC<BuyingSellingProps> = ({
  terms,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState({
    buying: emptySection(),
    selling: emptySection(),
  });
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
      Swal.fire({
        icon: "info",
        title: "No Changes",
        text: "Please apply changes before saving.",
      });
      return;
    }
    const confirm = await Swal.fire({
      title: "Save Terms?",
      text: "Do you want to update company terms and conditions?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
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
    <div className=" bg-app">
      {/* SUCCESS TOAST */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-theme shadow-sm p-4">
          <TermsAndCondition
            title="Buying Terms & Conditions"
            terms={formData.buying}
            setTerms={(updated) =>
              setFormData((prev) => ({ ...prev, buying: updated }))
            }
          />
        </div>

        <div className="bg-card rounded-xl border border-theme shadow-sm p-4">
          <TermsAndCondition
            title="Selling Terms & Conditions"
            terms={formData.selling}
            setTerms={(updated) =>
              setFormData((prev) => ({ ...prev, selling: updated }))
            }
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-theme rounded bg-card"
        >
          <RotateCcw className="inline-block mr-2" />
          Reset
        </button>

        <button
          onClick={handleSubmit}
          disabled={!hasChanges}
          title={!hasChanges ? "Apply changes before saving" : ""}
          className={`px-5 py-2 rounded text-white flex items-center gap-2
    ${hasChanges ? "bg-primary hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}
  `}
        >
          <Save className="inline-block mr-2" />
          Save Terms
        </button>
      </div>
    </div>
  );
};

export default BuyingSelling;
