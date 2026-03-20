import React, { useState, useEffect } from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { Plus, Trash2 } from "lucide-react";
import AddBankAccountModal from "../../../components/CompanySetup/AddBankAccountModal";
import { getAllBankAccounts } from "../../../api/BankAccountApi";
import { showApiError } from "../../../utils/alert";

interface PaymentInfoTabProps {
  form: SupplierFormData;
  onChange: (e: React.ChangeEvent<any>) => void;
  errors?: { bankAccount?: string };
  isEditMode?: boolean;
  partyType: "Supplier" | "Customer" | "Company";
  partyName: string;
}

export const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({
  form,
  onChange,
  errors = {},
  isEditMode = false,
  partyType,
  partyName,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const accounts = form.bankAccounts || [];

  useEffect(() => {
    if (!isEditMode || !partyName) return;

    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await getAllBankAccounts({
           party_type:
    partyType === "Company" ? undefined : partyType,
          party: partyName,
        });

        const mapped = (res.data || []).map((acc: any) => ({
          id: acc.id?.toString() || crypto.randomUUID(),
          bankName: acc.bankName || "",
          accountNumber: acc.accountNo || acc.accountNumber || "",
          accountHolder: acc.accountHolderName || acc.accountHolder || "",
          sortCode: acc.sortCode || "",
          swiftCode: acc.swiftCode || "",
          branchAddress: acc.branchAddress || "",
          isDefault: acc.isDefault === "1" || acc.isDefault === true,
        }));

        onChange({
          target: { name: "bankAccounts", value: mapped },
        } as any);
      } catch (err) {
        showApiError("Failed to load bank accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [isEditMode, partyName, partyType]);

  const handleDelete = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    onChange({ target: { name: "bankAccounts", value: updated } } as any);
  };

  const handleSetDefault = (id: string) => {
    const updated = accounts.map((a) => ({ ...a, isDefault: a.id === id }));
    onChange({ target: { name: "bankAccounts", value: updated } } as any);
  };

  const handleAddAccount = (newAccount: any) => {
    const mapped = {
      id: newAccount?.bank_account_id || Date.now().toString(),
      bankName: newAccount.bankName,
      accountNumber: newAccount.accountNo,
      accountHolder: newAccount.accountHolderName,
      sortCode: newAccount.sortCode,
      swiftCode: newAccount.swiftCode || "",
      branchAddress: newAccount.branchAddress,
      isDefault: newAccount.isDefault === "1" || newAccount.isDefault === true,
    };

    onChange({
      target: {
        name: "bankAccounts",
        value: [...accounts, mapped],
      },
    } as any);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* HEADER + ADD BUTTON */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-main">Bank Accounts</h3>

        <button
          type="button"
          onClick={() => isEditMode && setShowModal(true)}
          disabled={!isEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
            ${
              isEditMode
                ? "bg-primary text-white cursor-pointer hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
            }`}
        >
          <Plus size={14} />
          Add New Account
        </button>
      </div>

      {/* ERROR */}
      {errors.bankAccount && (
        <p className="text-xs text-red-500">{errors.bankAccount}</p>
      )}

      {/* INFO — create mode */}
      {!isEditMode && (
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <p className="text-sm font-semibold text-main mb-8">
            Bank accounts can be added after {partyType.toLowerCase()} creation
          </p>
          <div className="w-full max-w-2xl flex items-center justify-between">
            {/* STEP 1 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                1
              </div>
              <p className="text-xs text-center text-muted font-medium">
                Create the supplier first
              </p>
            </div>

            {/* CONNECTOR */}
            <div className="flex-1 border-t-2 border-dashed border-gray-300 mb-5" />

            {/* STEP 2 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                2
              </div>
              <p className="text-xs text-center text-muted font-medium">
                Open supplier in edit mode
              </p>
            </div>

            {/* CONNECTOR */}
            <div className="flex-1 border-t-2 border-dashed border-gray-300 mb-5" />

            {/* STEP 3 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                3
              </div>
              <p className="text-xs text-center text-muted font-medium">
                Add bank accounts from here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNTS LIST — edit mode */}
      {isEditMode && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {loadingAccounts && (
            <p className="text-sm text-muted text-center mt-8">
              Loading bank accounts...
            </p>
          )}

          {!loadingAccounts && accounts.length === 0 && (
            <p className="text-sm text-muted text-center mt-8">
              No bank accounts added yet
            </p>
          )}

          {!loadingAccounts &&
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="border border-theme rounded-xl p-4 flex justify-between items-center bg-card"
              >
                <div>
                  <p className="text-sm font-semibold text-main">
                    {acc.bankName || "—"}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {acc.accountHolder || acc.accountHolderName} •{" "}
                    {acc.accountNumber}
                  </p>
                  {acc.sortCode && (
                    <p className="text-xs text-muted">IFSC: {acc.sortCode}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {acc.isDefault ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(acc.id!)}
                      className="text-xs text-primary underline"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id!)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODAL */}
      <AddBankAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultAccountFor={partyType}
        partyName={partyName}
        onSubmit={handleAddAccount}
      />
    </div>
  );
};