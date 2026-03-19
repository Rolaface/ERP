import React, { useState } from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { Plus, Trash2 } from "lucide-react";
import AddBankAccountModal from "../../../components/CompanySetup/AddBankAccountModal";

interface PaymentInfoTabProps {
  form: SupplierFormData;
  onChange: (e: React.ChangeEvent<any>) => void;
  errors?: {
    bankAccount?: string;
  };
}

export const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const [showModal, setShowModal] = useState(false);
  const accounts = form.bankAccounts || [];

  const handleDelete = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    onChange({
      target: { name: "bankAccounts", value: updated },
    } as any);
  };

  const handleSetDefault = (id: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    onChange({
      target: { name: "bankAccounts", value: updated },
    } as any);
  };

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ADD BUTTON */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-main">Bank Accounts</h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={14} />
          Add New Account
        </button>
      </div>

      {/* ERROR */}
      {errors.bankAccount && (
        <p className="text-xs text-red-500">{errors.bankAccount}</p>
      )}

      {/* ACCOUNTS LIST */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {accounts.length === 0 && (
          <p className="text-sm text-muted text-center mt-8">
            No bank accounts added yet
          </p>
        )}

        {accounts.map((acc) => (
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

      {/* MODAL */}
      <AddBankAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultAccountFor="Supplier"
        partyName={form.supplierName}
        skipApi={true}
        onSubmit={(data) => {
          const mapped = {
            id: Date.now().toString(),
            bankName: data.bankName,
            accountNumber: data.accountNo,
            accountHolder: data.accountHolderName,
            sortCode: data.sortCode,
            swiftCode: data.swiftCode || "",
            branchAddress: data.branchAddress,
            isDefault:
              data.isDefault === "1" ||
              data.isDefault === true ||
              accounts.length === 0,
          };

          onChange({
            target: {
              name: "bankAccounts",
              value: [...accounts, mapped],
            },
          } as any);

          setShowModal(false);
        }}
      />
    </div>
  );
};