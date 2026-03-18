import React, { useState } from "react";
import type { BankAccount } from "../../types/company";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import { FaUniversity } from "react-icons/fa";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

interface Props {
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const mask = (val?: string) => {
  if (!val) return "";
  if (val.length <= 4) return "•".repeat(val.length);
  return "•".repeat(val.length - 4) + val.slice(-4);
};

const BankAccountSetup: React.FC<Props> = ({
  bankAccounts,
  setBankAccounts,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // 🔹 DELETE
  const handleDelete = (id: number | string) => {
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
  };

  // 🔹 SET DEFAULT
  const handleSetDefault = (id: number | string) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isdefault: b.id === id,
      }))
    );
  };

  const columns: Column<BankAccount>[] = [
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
      key: "swiftCode",
      header: "SWIFT",
      render: (row) => <span>{mask(row.swiftCode)}</span>,
    },
    {
      key: "sortCode",
      header: "IFSC / Sort Code",
      render: (row) => <span>{mask(row.sortCode)}</span>,
    },
    {
      key: "currency",
      header: "Currency",
    },
    {
      key: "dateAdded",
      header: "Date Added",
    },
    {
      key: "isdefault",
      header: "Default",
      render: (row) =>
        row.isdefault ? (
          <span className="text-green-600 font-semibold">Yes</span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => console.log(row)} iconOnly />
          <ActionButton type="edit" onClick={() => console.log("edit", row)} iconOnly />
          <ActionMenu
            onDelete={() => handleDelete(row.id)}
            customActions={[
              {
                label: "Set Default",
                onClick: () => handleSetDefault(row.id),
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
        <div className="mb-6">
   <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
  <FaUniversity className="text-primary" />
  Bank Accounts
</h1>
  </div>
      <Table
        columns={columns}
        data={bankAccounts}
        rowKey={(row) => row.id}
        showToolbar
        searchValue={search}
        onSearch={(q) => setSearch(q)}
        enableAdd
        addLabel="Add Bank Account"
        onAdd={() => setShowModal(true)}
      />

      {/* MODAL */}
      {showModal && (
        <AddBankAccountModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => {
            const mapped: BankAccount = {
              id: Date.now(),
              bankName: data.bank,
              accountNo: data.accountNumber,
              accountHolderName: data.accountHolder,
              swiftCode: data.swiftCode,
              sortCode: data.sortCode,
              currency: data.currency,
              openingBalance: "",
              dateAdded: data.dateAdded,
              branchAddress: data.address,
              isdefault: data.isDefault,
            };

            setBankAccounts((prev) => [...prev, mapped]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default BankAccountSetup;