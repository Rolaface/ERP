import React, { useEffect, useState } from "react";
import TermsAndCondition from "../../components/TermsAndCondition";
import { Check, RotateCcw, Save } from "lucide-react";

import type { Terms, TermSection } from "../../types/termsAndCondition";

import { updateCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
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
 

  const [formData, setFormData] = useState({
    buying: emptySection(),
    selling: emptySection(),
  });

 useEffect(() => {
  if (!terms) return;

  const mapSection = (section?: TermSection): TermSection => ({
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

  setFormData({
    buying: mapSection(terms.buying),
    selling: mapSection(terms.selling),
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
    showLoading("Saving Terms...");

    await updateCompanyById(payload);

    closeSwal();
    showSuccess("Terms and Conditions saved successfully!");
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};
  return (
    <div className="min-h-screen bg-app">
    

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
