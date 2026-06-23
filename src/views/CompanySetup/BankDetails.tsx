import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import { openBankAccountModal } from "../../store/modalStore";
import { Copy, CheckCircle } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getAllBankAccounts } from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";
import { useMaskedRows } from "../../utils/Usemaskedrows";
import { useBankAccountActions } from "../../utils/useBankAccountActions";
import { DefaultBadge, StatusBadge } from "../../components/UI_Utils/BankAccountBadges";

const BankDetails: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { isVisible, toggle, reveal } = useMaskedRows();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllBankAccounts({
        company: true,
        page,
        page_size: pageSize,
      });
      setBankAccounts(res.data);
      setTotalPages(res.pagination.total_pages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      showApiError(err?.message || "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return bankAccounts.filter((b) =>
      [b.bankName || "", b.accountHolderName || "", b.accountNo || "", b.currency || ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [bankAccounts, search]);

  // ── Actions hook ──────────────────────────────────────────────────────────
  const { handleToggleDisable, handleSetDefault, actionLoadingId } = useBankAccountActions(fetchAccounts);

  // ── Date formatter ────────────────────────────────────────────────────────
  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // ── Columns ───────────────────────────────────────────────────────────────
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
      tooltip: (row) => Number(row.isCompanyAccount) === 1 ? "Company" : row.accountFor || "—",
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
        <div className="flex items-center gap-2 py-1.5">
          <span className="block font-semibold">{row.bankName}</span>
          <DefaultBadge isDefault={row.isDefault} />
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
            <code className="tracking-widest text-xs">{reveal(row.id, row.accountNo)}</code>
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
          <span className="block">{reveal(row.id, row.sortCode)}</span>
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
          {row.isDefault
            ? <span className="text-green-600 font-semibold">Yes</span>
            : <span className="block">—</span>}
        </div>
      ),
    },
    {
      key: "isDisabled",
      header: "Status",
      align: "center",
      tooltip: (row) => (row.isDisabled ? "Disabled" : "Active"),
      render: (row) => (
        <div className="py-1.5">
          <StatusBadge isDisabled={row.isDisabled} />
        </div>
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
          <ActionButton
            type="view"
            iconOnly
            title={isVisible(row.id) ? "Hide Details" : "Show Details"}
            onClick={() => toggle(row.id)}
          />
          <ActionMenu
            onEnable={row.isDisabled ? () => handleToggleDisable(row) : undefined}
            onDisable={!row.isDisabled ? () => handleToggleDisable(row) : undefined}
            customActions={[
              {
                label: "Set Default",
                onClick: () => handleSetDefault(row),
                disabled: row.isDefault || actionLoadingId === String(row.id),
                icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-2">
      <Table
        columns={columns}
        data={filteredData}
        loading={loading}
        rowKey={(row) => String(row.id)}
        showToolbar
        searchValue={search}
        onSearch={setSearch}
        enableAdd
        enableColumnSelector
        tableId="bank-details"
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        addLabel="Add Bank Account"
        onAdd={() => {
          openBankAccountModal(
            { accountFor: "Company" },
            false,
            { onSuccess: () => fetchAccounts() },
          );
        }}
      />

      {!loading && filteredData.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No bank accounts found
        </div>
      )}
    </div>
  );
};

export default BankDetails;