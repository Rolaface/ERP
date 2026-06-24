import React, { useEffect, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, { ActionMenu, ActionGroup } from "../../components/ui/Table/ActionButton";
import { getAllBankAccounts } from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";
import { useMaskedRows } from "../../utils/Usemaskedrows";
import { useBankAccountActions } from "../../utils/useBankAccountActions";
import { DefaultBadge, StatusBadge } from "../../components/UI_Utils/BankAccountBadges";

interface Props {
  supplierName?: string;
  onAdd?: (refresh: () => void) => void;
  onEdit?: (row: BankAccount) => void;
}

const SupplierBankDetails: React.FC<Props> = ({ supplierName, onAdd }) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);

  const { isVisible, toggle, reveal } = useMaskedRows();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    if (!supplierName) return;
    try {
      setLoading(true);
      const res = await getAllBankAccounts({
        party_type: "Supplier",
        party: supplierName,
        page,
        page_size: pageSize,
      });
      setBankAccounts(res.data || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [supplierName, page, pageSize]);

  const refresh = useCallback(() => fetchAccounts(), [fetchAccounts]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { if (onAdd) onAdd(refresh); }, [onAdd, refresh]);

  // ── Actions hook ──────────────────────────────────────────────────────────
  const { getMenuActions } = useBankAccountActions(fetchAccounts);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<BankAccount>[] = [
    {
      key: "dateAdded",
      header: "Date",
      render: (row) =>
        row.dateAdded
          ? new Date(row.dateAdded).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.bankName || "—"}</span>
          <DefaultBadge isDefault={row.isDefault} />
        </div>
      ),
    },
    {
      key: "accountNo",
      header: "Acc No",
      render: (row) => reveal(row.id, row.accountNo),
    },
    {
      key: "accountHolderName",
      header: "Acc Holder",
      render: (row) => <span>{row.accountHolderName || "—"}</span>,
    },
    {
      key: "sortCode",
      header: "IFSC/Sort",
      render: (row) => reveal(row.id, row.sortCode),
    },
    {
      key: "isDisabled",
      header: "Status",
      render: (row) => <StatusBadge isDisabled={row.isDisabled} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            title={isVisible(row.id) ? "Hide Details" : "Show Details"}
            onClick={() => toggle(row.id)}
          />
          <ActionMenu customActions={getMenuActions(row)} />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <ModalTable
          columns={columns}
          data={bankAccounts}
          loading={loading}
          rowKey={(row) => String(row.id)}
          showToolbar
          searchValue={search}
          onSearch={setSearch}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
           pageSizeOptions={[20, 50, 100,200]}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          emptyMessage="No bank accounts found"
        />
      </div>
    </div>
  );
};

export default SupplierBankDetails;