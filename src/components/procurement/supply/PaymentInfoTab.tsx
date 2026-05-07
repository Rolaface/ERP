import React, { useState, useEffect,useMemo } from "react";
import type { SupplierFormData } from "../../../types/Supply/supplier";
import { Plus, Trash2 } from "lucide-react";

import { getAllBankAccounts } from "../../../api/BankAccountApi";
import { showApiError } from "../../../utils/alert";
import Table from "../../ui/Table/Table";
import type { Column } from "../../ui/Table/type";
import { openBankAccountModal } from "../../../store/modalStore";
interface PaymentInfoTabProps {
  form: SupplierFormData;
  onChange: (e: React.ChangeEvent<any>) => void;
  errors?: { bankAccount?: string };
  isEditMode?: boolean;
  partyType: "Supplier" | "Customer" | "Company";
  partyName: string;
  currency?: string;
   partyId?: string;
}

export const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({
  form,
  onChange,
  errors = {},
  isEditMode = false,
  partyType,
  partyName,
  currency,
    partyId,
}) => {

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const accounts = form.bankAccounts || [];
const columns: Column<any>[] = useMemo(() => [
  {
    key: "bankName",
    header: "Bank",
    sortable: true,
  },
  {
    key: "accountHolder",
    header: "Account Holder",
  },
  {
    key: "accountNumber",
    header: "Account Number",
  },
  {
    key: "sortCode",
    header: "IFSC",
  },
  {
    key: "isDefault",
    header: "Default",
    align: "center",
    render: (row: any) =>
      row.isDefault ? (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          Default
        </span>
      ) : (
        "—"
      ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (row: any) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row.id);
        }}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 size={14} />
      </button>
    ),
  },
], [accounts]);
  useEffect(() => {
    if (!isEditMode || !partyName) return;

    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await getAllBankAccounts({
           party_type:
    partyType === "Company" ? undefined : partyType,
         party: partyId || partyName, 
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
        showApiError(err);
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

  // const handleSetDefault = (id: string) => {
  //   const updated = accounts.map((a) => ({ ...a, isDefault: a.id === id }));
  //   onChange({ target: { name: "bankAccounts", value: updated } } as any);
  // };

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
          onClick={() => {
  if (!isEditMode) return;

  openBankAccountModal(
  {
    accountFor: partyType,
    partyName: partyName,        
    partyId: partyId, 
    currency: currency,
  },
    false,
    {
      onSuccess: (data) => {
        handleAddAccount(data);
      },
    }
  );
}}
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
                Add bank accounts from there 
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNTS LIST — edit mode */}
    {isEditMode && (
  <div className="flex-1 min-h-0">
    <Table
      columns={columns}
      data={accounts}
      loading={loadingAccounts}
      emptyMessage="No bank accounts added yet"
      rowKey={(row) => row.id}
      showToolbar
      
    

    />
  </div>
)}

      
    </div>
  );
};