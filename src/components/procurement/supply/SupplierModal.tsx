import React,{useState} from "react";
import { Building2, DollarSign, MapPin , FileText } from "lucide-react";
import Modal from "../../ui/modal/modal";
import { Button } from "../../ui/modal/formComponent";
import { SupplierInfoTab } from "./SupplierInfoTab";

import { useSupplierForm } from "../../../hooks/useSupplierForm";
import type {
  SupplierTab,
  SupplierFormData,
  Supplier,
} from "../../../types/Supply/supplier";
import { AddressTab } from "./AddressTab";
import TermsAndCondition from "../../TermsAndCondition";
import type { TermSection } from "../../../types/termsAndCondition";
import { BankAccount } from "../../../types/company";

import { PaymentInfoTab } from "./PaymentInfoTab";
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: SupplierFormData) => void;
  initialData?: Supplier | null;
  isEditMode?: boolean;
  existingSupplierCodes?: string[]; 
  bankAccounts?: BankAccount[];
  setBankAccounts?: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}
const tabs: { key: SupplierTab; icon: typeof Building2; label: string }[] = [
  { key: "supplier", icon: Building2, label: "Supplier" },
  { key: "payment", icon: DollarSign, label: "Bank Details" },
  { key: "address", icon: MapPin, label: "Address" },
  { key: "terms", icon: FileText, label: "Terms" },
];


const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  existingSupplierCodes = [] ,
  bankAccounts, 
  setBankAccounts

}) => {

  const {
    form,
    loading,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    reset,
    handleNext,
    errors,
    handleTermsChange
  } = useSupplierForm({
    initialData,
    isEditMode,
    onSuccess: onSubmit,
    isOpen,
    existingSupplierCodes
    
    
  });
//  useEffect(() => {
//   if (!isOpen) return;

//   const name = form.supplierName || initialData?.supplierName;
//   if (!name) return;

//   const fetchAccounts = async () => {
//     try {
//       const res = await getBankAccounts({
//         accountFor: "Supplier",
//         partyName: name,
//       });

//       setBankAccounts?.(res.data || []);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   fetchAccounts();
// }, [isOpen]);
  

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset} type="button">
          Reset
        </Button>
       {activeTab !== "terms" ? (
  <Button
  variant="primary"
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleNext();
  }}
>
  Next →
</Button>
) : (
  <Button
    variant="primary"
    loading={loading}
    type="submit"
    form="supplierForm"
  >
    {isEditMode ? "Update Supplier" : "Save Supplier"}
  </Button>
)}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Supplier" : "Add New Supplier"}
      subtitle={
        isEditMode
          ? "Update supplier information"
          : "Fill in the details to create a new supplier"
      }
      icon={Building2}
      footer={footer}
      maxWidth="6xl"
      height="77vh"
    >
      <form
        id="supplierForm"
        onSubmit={handleSubmit}
        noValidate
        className="h-full flex flex-col"
      >
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2
          ${
            activeTab === key
              ? "text-primary border-b-[3px] border-primary"
              : "text-muted border-b-[3px] border-transparent hover:text-main"
          }`}
              >
                {/* LABEL */}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="gap-6 p-4 flex-1 min-h-0 overflow-hidden">
          {activeTab === "supplier" && (
            <SupplierInfoTab
              form={form}
              onChange={handleChange}
              errors={errors}
            />
          )}
{activeTab === "payment" && (
  <PaymentInfoTab
    form={form}
    onChange={handleChange}
    errors={errors}
    isEditMode={isEditMode} 
  />
)}
          {activeTab === "address" && (
            <AddressTab form={form} onChange={handleChange} errors={errors} />
          )}
          {activeTab === "terms" && (
  <TermsAndCondition
    terms={form.terms?.buying as TermSection}
    setTerms={(updated) =>
      handleTermsChange("buying", updated)
    }
    type="buying"
  />
)}
        </div>
      </form>
    </Modal>
  );
};

export default SupplierModal;
