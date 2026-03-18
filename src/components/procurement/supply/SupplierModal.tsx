import React,{useState} from "react";
import { Building2, DollarSign, MapPin , FileText } from "lucide-react";
import Modal from "../../ui/modal/modal";
import { Button } from "../../ui/modal/formComponent";
import { SupplierInfoTab } from "./SupplierInfoTab";
import AddBankAccountModal from "../../../components/CompanySetup/AddBankAccountModal";
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
import { useEffect } from "react";
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
  const [showModal, setShowModal] = useState(false);
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
 useEffect(() => {
  if (!isOpen) return;

  const name = form.supplierName || initialData?.supplierName;
  if (!name) return;

  const fetchAccounts = async () => {
    try {
      const res = await getBankAccounts({
        accountFor: "Supplier",
        partyName: name,
      });

      setBankAccounts?.(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  fetchAccounts();
}, [isOpen]);
  

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
  <>
    {/* Add Button */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Bank Accounts</h3>

      <Button
        variant="primary"
        type="button"
        onClick={() => setShowModal(true)}
      >
        + Add Bank Account
      </Button>
    </div>

    {/* Simple List (optional but recommended) */}
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
     {(!bankAccounts || bankAccounts.length === 0) && (
  <p className="text-sm text-muted">No bank accounts added</p>
)}

      {bankAccounts?.map((acc) => (
        <div
          key={acc.id}
          className="border p-3 rounded-lg flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{acc.bankName}</p>
            <p className="text-xs text-muted">
              {acc.accountHolderName} • {acc.accountNo}
            </p>
          </div>

          {acc.isdefault && (
            <span className="text-green-600 text-xs font-semibold">
              Default
            </span>
          )}
        </div>
      ))}
    </div>

    {/* Modal */}
    <AddBankAccountModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  defaultAccountFor="Supplier"
  partyName={form.supplierName}
     onSubmit={async (data) => {
  try {
    const payload = {
      accountHolderName: data.accountHolder,
      accountNo: data.accountNumber,
      bankName: data.bank,
      branchAddress: data.address,
      currency: data.currency,
      dateAdded: data.dateAdded,
      sortCode: data.sortCode,
      iban: data.iban || "",
      accountFor: "Supplier",
      partyName: form.supplierName, 
      isDefault: data.isDefault ? "1" : "0",
      isDisable: "0",
    };

    const res = await createBankAccount(payload);

    const mapped: BankAccount = {
      id: res?.id || Date.now().toString(),
      bankName: payload.bankName,
      accountNo: payload.accountNo,
      accountHolderName: payload.accountHolderName,
      swiftCode: payload.sortCode,
      sortCode: payload.sortCode,
      currency: payload.currency,
      openingBalance: "",
      dateAdded: payload.dateAdded,
      branchAddress: payload.branchAddress,
      isdefault: payload.isDefault === "1",
    };

   setBankAccounts?.((prev) => [...prev, mapped]);

    setShowModal(false);
  } catch (err) {
    console.error(err);
  }
}}
    />
  </>
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
