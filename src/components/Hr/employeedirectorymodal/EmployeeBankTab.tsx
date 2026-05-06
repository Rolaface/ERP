import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import ModalTable from "../../ui/Table/ModalTableInside";
import type { Column } from "../../ui/Table/type";
import { openBankAccountModal } from "../../../store/modalStore";
import { getAllBankAccounts } from "../../../api/BankAccountApi";
import { showApiError } from "../../../utils/alert";

type Props = {
  formData: any;
  setFormData: (data: any) => void;
  isEditMode: boolean;
  employeeId?: string;
};
type BankAccountResponse = {
  bank_account_id: string;
  bankName: string;
  accountNo: string;
  accountHolderName: string;
  sortCode: string;
};

const EmployeeBankTab: React.FC<Props> = ({
  formData,
  setFormData,
  isEditMode,
  employeeId,
}) => {
  const [loading, setLoading] = useState(false);
  const accounts = formData.bankAccounts || [];


  useEffect(() => {
    if (!isEditMode || !employeeId) return;

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await getAllBankAccounts({
          party_type: "Employee",
          party: employeeId,
        });

        const mapped = (res.data || []).map((acc: any) => ({
          id: acc.id,
          bankName: acc.bankName,
          accountNumber: acc.accountNo,
          accountHolder: acc.accountHolderName,
          sortCode: acc.sortCode,
          isDefault: acc.isDefault,
        }));

        setFormData((prev: any) => ({
          ...prev,
          bankAccounts: mapped,
        }));
      } catch {
        showApiError("Failed to load bank accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [isEditMode, employeeId]);


const columns: Column<any>[] = useMemo(() => [
  {
    key: "bankName",
    header: "Bank",
    width: "20%",
  },
  {
    key: "accountHolder",
    header: "Account Holder",
    width: "25%",
  },
  {
    key: "accountNumber",
    header: "Account Number",
    width: "25%",
  },
  {
    key: "sortCode",
    header: "IFSC",
    width: "15%",
  },
  {
    key: "actions",
    header: "",
    width: "15%",
    align: "right",
    render: (row: any) => (
      <button
        onClick={() => {
          const updated = accounts.filter((a: any) => a.id !== row.id);
          setFormData((prev: any) => ({
            ...prev,
            bankAccounts: updated,
          }));
        }}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 size={14} />
      </button>
    ),
  },
], [accounts]);

  const handleAdd = () => {
    if (!isEditMode) return;

    openBankAccountModal(
      {
        accountFor: "Employee",
        partyId: employeeId,
        partyName: formData.firstName + " " + formData.lastName,
        currency: formData.currency,
      },
      false,
      {
       onSuccess: (data) => {
  const d = data as BankAccountResponse;
          const newAccount = {
  id: d.bank_account_id,
  bankName: d.bankName,
  accountNumber: d.accountNo,
  accountHolder: d.accountHolderName,
  sortCode: d.sortCode,
};

          setFormData((prev: any) => ({
            ...prev,
           bankAccounts: [...(prev.bankAccounts || []), newAccount],
          }));
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Employee Bank Accounts</h3>

        <button
          onClick={handleAdd}
          disabled={!isEditMode}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs"
        >
         Add Bank Account
        </button>
      </div>

      {/* Create Mode Message */}
      {!isEditMode && (
        <p className="text-xs text-muted">
          Bank accounts can be added after employee is created.
        </p>
      )}

      {/* Table */}
      {isEditMode && (
        <ModalTable
  columns={columns}
  data={accounts}
  loading={loading}
  rowKey={(row) => row.id}
/>
      )}
    </div>
  );
};  

export default EmployeeBankTab;