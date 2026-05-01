import React, { useState, useCallback, useEffect, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { openBankModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { getAllBanks, deleteBank } from "../../api/BankApi";
import type { Bank } from "../../api/BankApi";
import { showApiError, showConfirm, showSuccess } from "../../utils/alert";
import { FaUniversity } from "react-icons/fa";
// ─── Main Component ───────────────────────────────────────────────────────────

const BankPage: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<keyof Bank | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const refreshKey = useDataRefreshStore(
    (state) => state.refreshFlags[REFRESH_KEYS.Bank],
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAllBanks(page, pageSize);
      setBanks(resp.data ?? []);
      setTotalItems(resp.pagination?.total_count ?? 0);
    } catch (err) {
      showApiError(err);
      setBanks([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks, refreshKey]);

  // ── Client-side sort ───────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortBy) return banks;
    return [...banks].sort((a, b) => {
      const valA = String(a[sortBy] ?? "");
      const valB = String(b[sortBy] ?? "");
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [banks, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleView = (row: Bank) => {
    openBankModal({ ...row }, true);
  };

  const handleEdit = (row: Bank, e: React.MouseEvent) => {
    e.stopPropagation();
    openBankModal({ ...row }, true);
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await showConfirm("This action cannot be undone.", {
      title: "Delete Bank?",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!confirmed) return;

    try {
      await deleteBank(name);
      showSuccess("Bank deleted successfully.");
      fetchBanks();
    } catch (err) {
      showApiError(err);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<Bank>[] = [
    {
      key: "bank_name",
      header: "Bank Name",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-main text-sm">{row.bank_name}</span>
      ),
    },
    {
      key: "swift_number",
      header: "SWIFT / BIC",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-main tracking-wider">
          {row.swift_number || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => handleView(row)} iconOnly />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(row, e as React.MouseEvent)}
            iconOnly
            title="Edit Bank"
          />
          <ActionMenu
            onDelete={(e) => handleDelete(row.name, e as React.MouseEvent)}
            customActions={[
              { label: "View Details", onClick: () => handleView(row) },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
       <div className="mb-6">
              <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
                <FaUniversity className="text-primary" />
                Bank Accounts
              </h1>
            </div>
      <Table
        columns={columns}
        data={sortedData}
        rowKey={(row) => row.name}
        tableId="banks"
        loading={loading}
        isFetching={false}
        showToolbar
        enableAdd
        addLabel="Add Bank"
        onAdd={() => openBankModal(null, false)}
        enableColumnSelector
        enableExport
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
      />
    </div>
  );
};

export default BankPage;