import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import { FaUniversity } from "react-icons/fa";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getAllBankAccounts , updateBankAccountStatus} from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";

const mask = (val?: string) => {
  if (!val) return "—";
  if (val.length <= 4) return "•".repeat(val.length);
  return "•".repeat(val.length - 4) + val.slice(-4);
};

const BankAccountSetup: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  
const fetchAccounts = useCallback(async () => {
  try {
    setLoading(true); 
    const data = await getAllBankAccounts();

    const safeData = data.map((item) => ({
      ...item,
      id: String(item.id), 
    }));

    setBankAccounts(safeData);
  } catch (err) {
    showApiError("Failed to load bank accounts");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);


  const handleToggleDisable = useCallback(async (row: BankAccount) => {
  try {
    setActionLoadingId(String(row.id));

    await updateBankAccountStatus({
      bankAccountId: String(row.id),
      isDisabled: row.isDisabled ? 0 : 1,
      isDefault: row.isDisabled ? (row.isDefault ? 1 : 0) : 0,
    });

    await fetchAccounts();
  } catch (err: any) {
    showApiError(err.message);
  } finally {
  setActionLoadingId(null);
}
}, [fetchAccounts]);

 
  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    return bankAccounts.filter((b) =>
      [
        b.bankName,
        b.accountHolderName,
        b.accountNo,
        b.currency,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [bankAccounts, search]);

 

const handleSetDefault = useCallback(async (row: BankAccount) => {
  try {
    setActionLoadingId(String(row.id));

    await updateBankAccountStatus({
      bankAccountId: String(row.id),
      isDefault: 1,
      isDisabled: 0,
    });

    await fetchAccounts(); 
  } catch (err: any) {
    showApiError(err.message);
  } finally {
  setActionLoadingId(null);
}
}, [fetchAccounts]);

  const columns: Column<BankAccount>[] = [
     {
      key: "dateAdded",
      header: "Date Added",
      render: (row) => row.dateAdded || "—",
    },
    {
      key: "accountFor",
      header: "Account For",
      render: (row) => row.accountFor,
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => (
        <span className="font-semibold">{row.bankName}</span>
      ),
    },
    {
      key: "accountNo",
      header: "Account No",
      render: (row) => <span>{mask(row.accountNo)}</span>,
    },
    {
      key: "accountHolderName",
      header: "Account Holder",
    },
    {
      key: "sortCode",
      header: "IFSC / Sort Code",
      render: (row) => <span>{mask(row.sortCode)}</span>,
    },
 
   
    {
      key: "isDefault",
      header: "Default",
      render: (row) =>
        row.isDefault ? (
          <span className="text-green-600 font-semibold">Yes</span>
        ) : (
          "—"
        ),
    },
    {
  key: "isDisabled",
  header: "Status",
  render: (row) =>
    row.isDisabled ? (
      <span className="text-red-500 font-semibold">Disabled</span>
    ) : (
      <span className="text-green-600">Active</span>
    ),
},
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="edit"
            onClick={() => console.log("EDIT:", row)}
            iconOnly
          />
          <ActionMenu
    customActions={[
      {
        label: "Set Default",
        onClick: () => handleSetDefault(row),
        disabled: actionLoadingId === String(row.id)
      },
      {
        label: row.isDisabled ? "Enable" : "Disable",
        onClick: () => handleToggleDisable(row),
        disabled: actionLoadingId === String(row.id)
      },
    ]}
  />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaUniversity className="text-primary" />
          Bank Accounts
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={filteredData} 
        loading={loading}
        rowKey={(row) => String(row.id)}
        showToolbar
        searchValue={search}
        onSearch={setSearch}
        enableAdd
        addLabel="Add Bank Account"
        onAdd={() => setShowModal(true)}
      />

      {/* EMPTY STATE */}
      {!loading && filteredData.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No bank accounts found
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <AddBankAccountModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            fetchAccounts(); 
          }}
        />
      )}
    </div>
  );
};

export default BankAccountSetup;