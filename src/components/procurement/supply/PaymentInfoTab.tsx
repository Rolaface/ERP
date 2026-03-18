import React from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { ModalInput } from "../../ui/modal/modalComponent";
import { Plus, Trash2, Check } from "lucide-react";

interface PaymentInfoTabProps {
  form: SupplierFormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  errors?: {
    bankAccount?: string;
  };
}

export const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const accounts = form.bankAccounts || [];
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // auto select first
  React.useEffect(() => {
    if (accounts.length && !selectedId) {
      setSelectedId(accounts[0].id);
    }
  }, [accounts]);

  const selectedAccount = accounts.find(a => a.id === selectedId);

  const updateAccount = (field: string, value: string) => {
    const updated = accounts.map(a =>
      a.id === selectedId ? { ...a, [field]: value } : a
    );

    onChange({
      target: { name: "bankAccounts", value: updated },
    } as any);
  };

  return (
    <section className="flex gap-4 h-full min-h-0">

      {/* LEFT PANEL */}
      <div className="w-1/3 bg-card border rounded-xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="bg-primary text-white px-4 py-3 text-sm font-semibold">
          BANK ACCOUNTS
        </div>

        <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0">

          {/* ERROR */}
          {errors.bankAccount && (
            <p className="text-xs text-red-500">{errors.bankAccount}</p>
          )}

          {/* ADD BUTTON */}
          <button
            type="button"
            onClick={() => {
              const newAccount = {
                id: crypto.randomUUID(),
                bankName: "",
                accountNumber: "",
                accountHolder: "",
                sortCode: "",
                swiftCode: "",
                branchAddress: "",
                isDefault:
                  !accounts.length ||
                  !accounts.some(a => a.isDefault),
              };

              const updated = [...accounts, newAccount];

              onChange({
                target: { name: "bankAccounts", value: updated },
              } as any);

              setSelectedId(newAccount.id);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm"
          >
            <Plus size={14} />
            Add New Account
          </button>

          {/* LIST */}
          {accounts.map(acc => (
            <div
              key={acc.id}
              onClick={() => setSelectedId(acc.id)}
              className={`p-3 rounded-lg border cursor-pointer transition
                ${selectedId === acc.id
                  ? "border-primary bg-primary/10"
                  : "hover:bg-muted"
                }`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {acc.bankName || "New Account"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {acc.accountNumber
                      ? acc.accountNumber
                      : "----"}
                  </p>
                </div>

                {acc.isDefault && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-card border rounded-xl flex flex-col h-full overflow-hidden">

        {/* HEADER */}
        <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-semibold">
            ACCOUNT DETAILS
          </span>

          {selectedAccount && (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs bg-white/20 px-3 py-1 rounded"
                onClick={() => {
                  const updated = accounts.map(a => ({
                    ...a,
                    isDefault: a.id === selectedAccount.id,
                  }));

                  onChange({
                    target: {
                      name: "bankAccounts",
                      value: updated,
                    },
                  } as any);
                }}
              >
                <Check size={12} className="inline mr-1" />
                Set Default
              </button>

              <button
                type="button"
                className="text-xs bg-white/20 px-3 py-1 rounded"
                onClick={() => {
                  if (accounts.length === 1) {
                    alert("At least one account is required");
                    return;
                  }

                  const updated = accounts.filter(
                    a => a.id !== selectedAccount.id
                  );

                  if (!updated.some(a => a.isDefault)) {
                    updated[0].isDefault = true;
                  }

                  onChange({
                    target: {
                      name: "bankAccounts",
                      value: updated,
                    },
                  } as any);

                  setSelectedId(updated[0]?.id || null);
                }}
              >
                <Trash2 size={12} className="inline mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* BODY */}
       <div className="p-4 flex-1 overflow-hidden">
          {!selectedAccount ? (
            <p className="text-sm text-gray-500">
              Select an account
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <ModalInput
                label="Bank Name"
                value={selectedAccount.bankName}
                onChange={(e) =>
                  updateAccount("bankName", e.target.value)
                }
                required
              />

              <ModalInput
                label="Account Holder"
                value={selectedAccount.accountHolder}
                onChange={(e) =>
                  updateAccount("accountHolder", e.target.value)
                }
                required
              />

              <ModalInput
                label="Account Number"
                value={selectedAccount.accountNumber}
                onChange={(e) =>
                  updateAccount("accountNumber", e.target.value)
                }
                required
              />


              <ModalInput
                label="IFSC / Sort Code"
                value={selectedAccount.sortCode}
                onChange={(e) =>
                  updateAccount("sortCode", e.target.value)
                }
                required
              />



              <ModalInput
                label="Branch Address"
                value={selectedAccount.branchAddress}
                onChange={(e) =>
                  updateAccount("branchAddress", e.target.value)
                }
              />

            </div>
          )}
        </div>
      </div>
    </section>
  );
};