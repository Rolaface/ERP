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
import { getAllBankAccounts, updateBankAccountStatus } from "../../api/BankAccountApi";

import { showApiError, showSuccess } from "../../utils/alert";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);


  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getAllBankAccounts({
        page,
        search,
        page_size: pageSize,
      });

      setBankAccounts(res.data || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err: any) {
      showApiError(err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);


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
      render: (row) => (
        <span title={row.accountNo || ""} className="cursor-pointer">
          {mask(row.accountNo)}
        </span>
      ),
    },
    {
      key: "accountHolderName",
      header: "Account Holder",
    },
    {
      key: "sortCode",
      header: "IFSC / Sort Code",
      render: (row) => (
        <span title={row.sortCode || ""} className="cursor-pointer">
          {mask(row.sortCode)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "currency",
      render: (row) => (
        <span className="font-semibold">{row.currency}</span>
      ),
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
        data={bankAccounts}
        loading={loading}
        rowKey={(row) => String(row.id)}
        showToolbar
        searchValue={search}
        onSearch={setSearch}
        enableAdd
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        addLabel="Add Bank Account"
        onAdd={() => setShowModal(true)}
      />


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