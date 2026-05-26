import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import { openBankAccountModal } from "../../store/modalStore";
import { Copy } from "lucide-react"
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getAllBankAccounts, updateBankAccountStatus } from "../../api/BankAccountApi";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import { showApiError, showSuccess } from "../../utils/alert";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";

const mask = (val?: string) => {
  if (!val) return "—";
  if (val.length <= 4) return "*".repeat(val.length);
  return "*".repeat(val.length - 4) + val.slice(-4);
};

const BANK_ACCOUNT_MODULE = "Bank Account";

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
  const { can } = usePermission();

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
    } catch (err) {
      showApiError(err);
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
    } catch (err) {
      showApiError(err);
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
    } catch (err) {
      showApiError(err);
    } finally {
      setActionLoadingId(null);
    }
  }, [fetchAccounts]);
  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const columns: Column<BankAccount>[] = [
    {
      key: "dateAdded",
      header: "Date Added",
      align: "center",
      tooltip: (row) => row.dateAdded ? formatDate(row.dateAdded) : "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="block">{row.dateAdded ? formatDate(row.dateAdded) : "—"}</span>
        </div>
      ),
    },
    {
      key: "accountFor",
      header: "Acc For",
      align: "center",
      tooltip: (row) =>
        Number(row.isCompanyAccount) === 1 ? "Company" : row.accountFor || "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="block">
            {Number(row.isCompanyAccount) === 1 ? "Company" : row.accountFor || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "bankName",
      header: "Bank",
      align: "center",
      tooltip: (row) => row.bankName || "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="block font-semibold">{row.bankName}</span>
        </div>
      ),
    },
    {
      key: "accountNo",
      header: "Acc No",
      align: "center",
      tooltip: (row) => row.accountNo || "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="inline-flex items-center gap-1.5">
            <code className="tracking-widest text-xs">{mask(row.accountNo)}</code>
            {row.accountNo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(row.accountNo!);
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Copy account number"
              >
                <Copy size={13} />
              </button>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "accountHolderName",
      header: "Acc Holder",
      align: "center",
      tooltip: (row) => String(row.accountHolderName || "—"),
      render: (row) => (
        <div className="py-1.5">
          <span className="block">{row.accountHolderName || "—"}</span>
        </div>
      ),
    },
    {
      key: "sortCode",
      header: "IFSC/Sort",
      align: "center",
      tooltip: (row) => row.sortCode || "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="block">{(row.sortCode)}</span>
        </div>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      align: "center",
      tooltip: (row) => row.currency || "—",
      render: (row) => (
        <div className="py-1.5">
          <span className="block font-semibold">{row.currency}</span>
        </div>
      ),
    },
    {
      key: "isDefault",
      header: "Default",
      align: "center",
      tooltip: (row) => (row.isDefault ? "Default account" : "Not default"),
      render: (row) => (
        <div className="py-1.5">
          {row.isDefault ? (
            <span className="text-green-600 font-semibold">Yes</span>
          ) : (
            <span className="block">—</span>
          )}
        </div>
      ),
    },
    {
      key: "isDisabled",
      header: "Status",
      align: "right",
      tooltip: (row) => (row.isDisabled ? "Disabled" : "Active"),
      render: (row) => (
        <div className="py-1.5">
          {row.isDisabled ? (
            <span className="text-red-500 font-semibold">Disabled</span>
          ) : (
            <span className="text-green-600">Active</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <PermissionGate module={BANK_ACCOUNT_MODULE} action="write">
            <ActionButton
              type="view"
              onClick={() =>
                openBankAccountModal(row, true, {
                  isViewMode: true,
                })
              }
              iconOnly
            />
          </PermissionGate>
          <ActionMenu
            customActions={
              can(BANK_ACCOUNT_MODULE, "write")
                ? [
                  {
                    label: "Set Default",
                    onClick: () => handleSetDefault(row),
                    disabled: actionLoadingId === String(row.id),
                  },
                  {
                    label: row.isDisabled ? "Enable" : "Disable",
                    onClick: () => handleToggleDisable(row),
                    disabled: actionLoadingId === String(row.id),
                  },
                ]
                : []
            }
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <AppPage>


      {/* TABLE */}
      <AppPageBody>
        <Table
          columns={columns}
          data={bankAccounts}
          loading={loading}
          rowKey={(row) => String(row.id)}
          showToolbar
          searchValue={search}
          onSearch={setSearch}
          enableAdd={can(BANK_ACCOUNT_MODULE, "create")}
          currentPage={page}
          totalPages={totalPages}
          enableColumnSelector
          tableId="bank-accounts"
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          onPageChange={setPage}
          addLabel="Add Bank Account"
          onAdd={() => openBankAccountModal(null, false, {
            onSuccess: () => fetchAccounts(),
          })}
        />
      </AppPageBody>



    </AppPage>
  );
};

export default BankAccountSetup;