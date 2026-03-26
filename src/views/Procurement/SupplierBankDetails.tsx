import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  getAllBankAccounts,
  updateBankAccountStatus,
} from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";

const mask = (val?: string | number | null) => {
  const str = val ? String(val) : "";
  if (!str) return "—";
  if (str.length <= 4) return "•".repeat(str.length);
  return "•".repeat(str.length - 4) + str.slice(-4);
};

interface Props {
  supplierName?: string;
  onAdd?: (refresh: () => void) => void;
  onEdit?: (row: BankAccount) => void;
}

const SupplierBankDetails: React.FC<Props> = ({
  supplierName,
  onAdd,
  onEdit,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);


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
      setBankAccounts(res.data);

    } catch (err: any) {
      showApiError(err?.message || "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [supplierName]);
  const refresh = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  useEffect(() => {
    if (onAdd) {
      onAdd(refresh);
    }
  }, [onAdd, refresh]);


  /*  ACTIONS  */

  const handleSetDefault = useCallback(
    async (row: BankAccount) => {
      if (row.isDisabled) {
        showApiError("Disabled account cannot be default");
        return;
      }

      try {
        setActionLoadingId(String(row.id));

        await updateBankAccountStatus({
          bankAccountId: String(row.id),
          isDefault: 1,
          isDisabled: 0,
        });

        await fetchAccounts();
      } catch (err: any) {
        showApiError(err?.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAccounts]
  );

  const handleToggleDisable = useCallback(
    async (row: BankAccount) => {
      try {
        setActionLoadingId(String(row.id));

        await updateBankAccountStatus({
          bankAccountId: String(row.id),
          isDisabled: row.isDisabled ? 0 : 1,
          isDefault: row.isDisabled ? (row.isDefault ? 1 : 0) : 0,
        });

        await fetchAccounts();
      } catch (err: any) {
        showApiError(err?.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAccounts]
  );

  /*  COLUMNS  */

  const columns: Column<BankAccount>[] = [
    {
      key: "dateAdded",
      header: "Date Added",
      render: (row) =>
        row.dateAdded
          ? new Date(row.dateAdded).toLocaleDateString("en-GB")
          : "—",
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => (
        <span className="font-semibold">{row.bankName || "—"}</span>
      ),
    },
    {
      key: "accountNo",
      header: "Account No",
      render: (row) => (
        <span
          title={row.accountNo ? String(row.accountNo) : ""}
          className="cursor-pointer"
        >
          {mask(row.accountNo)}
        </span>
      ),
    },
    {
      key: "accountHolderName",
      header: "Account Holder",
      render: (row) => <span>{row.accountHolderName || "—"}</span>,
    },
    {
      key: "sortCode",
      header: "IFSC / Sort Code",
      render: (row) => (
        <span
          title={row.sortCode ? String(row.sortCode) : ""}
          className="cursor-pointer"
        >
          {mask(row.sortCode)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => <span>{row.currency || "—"}</span>,
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
          <ActionButton type="edit" onClick={() => onEdit?.(row)} iconOnly />

          <ActionMenu
            customActions={[
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
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  /*  UI  */

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
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

          pageSizeOptions={[10, 25, 50, 100]}

          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          emptyMessage="No bank accounts found"
        />
      </div>
    </div>
  );
};

export default SupplierBankDetails;