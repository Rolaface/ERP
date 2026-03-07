import React, { useEffect, useState } from "react";
import TermsAndCondition from "../../components/TermsAndCondition";
import { Check, RotateCcw, Save } from "lucide-react";

import type { Terms, TermSection } from "../../types/termsAndCondition";

import { updateCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

interface BuyingSellingProps {
  terms?: Terms | null;
}

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

const BuyingSelling: React.FC<BuyingSellingProps> = ({ terms }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    buying: emptySection(),
    selling: emptySection(),
  });

  useEffect(() => {
    if (!terms) return;

    setFormData({
      buying: {
        general: terms.buying?.general ?? "",
        delivery: terms.buying?.delivery ?? "",
        cancellation: terms.buying?.cancellation ?? "",
        warranty: terms.buying?.warranty ?? "",
        liability: terms.buying?.liability ?? "",
        payment: {
          phases: terms.buying?.payment?.phases ?? [],
          dueDates: terms.buying?.payment?.dueDates ?? "",
          lateCharges: terms.buying?.payment?.lateCharges ?? "",
          taxes: terms.buying?.payment?.taxes ?? "",
          notes: terms.buying?.payment?.notes ?? "",
        },
      },
      selling: {
        general: terms.selling?.general ?? "",
        delivery: terms.selling?.delivery ?? "",
        cancellation: terms.selling?.cancellation ?? "",
        warranty: terms.selling?.warranty ?? "",
        liability: terms.selling?.liability ?? "",
        payment: {
          phases: terms.selling?.payment?.phases ?? [],
          dueDates: terms.selling?.payment?.dueDates ?? "",
          lateCharges: terms.selling?.payment?.lateCharges ?? "",
          taxes: terms.selling?.payment?.taxes ?? "",
          notes: terms.selling?.payment?.notes ?? "",
        },
      },
    });
  }, [terms]);

  const handleReset = () => {
    setFormData({
      buying: emptySection(),
      selling: emptySection(),
    });
  };

  const handleSubmit = async () => {
    const payload = {
      id: COMPANY_ID,
      terms: formData,
    };

    try {
      await updateCompanyById(payload);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update company terms and conditions details.");
    }
  };

  return (
    <div className="min-h-screen bg-app">
      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-card border border-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Check className="text-success" />
          <span>Terms saved successfully!</span>
        </div>
      )}

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
          className="px-5 py-2 rounded bg-primary text-white"
        >
          <Save className="inline-block mr-2" />
          Save Terms
        </button>
      </div>
    </div>
  );
};

export default BuyingSelling;
