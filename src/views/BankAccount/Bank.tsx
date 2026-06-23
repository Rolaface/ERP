import React, { useState, useCallback, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { openBankModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import {
  getAllBanks,
  deleteBank,
  getBankById,
} from "../../api/BankApi";
import type { Bank } from "../../api/BankApi";
import { showApiError, showConfirm, showSuccess } from "../../utils/alert";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";


const BANK_MODULE = "Bank";

const BankPage: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const { can } = usePermission();
  const refreshKey = useDataRefreshStore(
    (state) => state.refreshFlags[REFRESH_KEYS.Bank],
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAllBanks(page, pageSize, search);
      setBanks(resp.data ?? []);
      setTotalItems(resp.pagination?.total ?? 0);
    } catch (err) {
      showApiError(err);
      setBanks([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // ── Handlers ───────────────────────────────────────────────────────────────
const handleView = async (row: Bank, e?: React.MouseEvent) => {
  e?.stopPropagation();

    try {
      const bank = await getBankById(row.name);

      openBankModal(
        bank,
        false,
        {
          isViewMode: true,
        },
      );
    } catch (err) {
      showApiError(err);
    }
  };

  const handleEdit = async (
    row: Bank,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      const bank = await getBankById(row.name);

      openBankModal(bank, true);
    } catch (err) {
      showApiError(err);
    }
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
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(row, e as React.MouseEvent)}
            iconOnly
            title="View Bank"
          />

          <PermissionGate module={BANK_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(row, e as React.MouseEvent)}
              iconOnly
              title="Edit Bank"
            />
          </PermissionGate>

          {can(BANK_MODULE, "delete") && (
            <ActionMenu
              onDelete={(e) =>
                handleDelete(row.name, e as React.MouseEvent)
              }
            />
          )}
        </ActionGroup>
      ),
    },
  ];

  return (
    <AppPage>

      <AppPageBody>
        <Table
          columns={columns}
          data={banks}
          rowKey={(row) => row.name}
          tableId="banks"
          loading={loading}
          isFetching={false}
          showToolbar
          enableAdd={can(BANK_MODULE, "create")}
          addLabel="Add Bank"
          onAdd={() => openBankModal(null, false)}
          enableColumnSelector
          enableExport={can(BANK_MODULE, "export")}
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
          searchValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onRowDoubleClick={(row) => handleView(row)}
        />
      </AppPageBody>
    </AppPage>
  );
};

export default BankPage;