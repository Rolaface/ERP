import React, { useEffect, useState, useCallback } from "react";
import type { BankAccount } from "../../types/BankAccount/bank";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import type { Column } from "../../components/ui/Table/type";
import PassView from "../../components/ui/Table/PassView";
import ActionButton from "../../components/ui/Table/ActionButton";

import {
  getAllBankAccounts,
  updateBankAccountStatus,
} from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";


interface Props {
  customerName?: string;
  onAdd?: (refresh: () => void) => void;
  onEdit?: (row: BankAccount) => void;
}

const CustomerBankDetails: React.FC<Props> = ({
  customerName,
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


  const mask = (val?: string | number | null) => {
  if (!val) return "—";

  const str = String(val);

  if (str.length <= 4) {
    return "*".repeat(str.length);
  }

  return "*".repeat(str.length - 4) + str.slice(-4);
};

  const fetchAccounts = useCallback(async () => {
    if (!customerName) return;
    try {
      setLoading(true);
      const res = await getAllBankAccounts({
        party_type: "Customer",
        party: customerName,
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
  }, [customerName, page, pageSize]);

  const refresh = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
        showApiError(err.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAccounts],
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
        showApiError(err.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAccounts],
  );
  const [visibleRows, setVisibleRows] = useState<Record<string, boolean>>({});

const toggleRowVisibility = (id: string) => {
  setVisibleRows((prev) => ({
    ...prev,
    [id]: !prev[id],
  }));
};

  const columns: Column<BankAccount>[] = [
    {
      key: "dateAdded",
      header: "Date",
      render: (row) =>
        row.dateAdded
          ? new Date(row.dateAdded).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.bankName || "—"}</span>

          {row.isDefault && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              Default
            </span>
          )}
        </div>
      ),
    },
   {
  key: "accountNo",
  header: "Acc No",
  render: (row) =>
    visibleRows[row.id]
      ? row.accountNo
      : mask(row.accountNo),
},
{
  key: "sortCode",
  header: "IFSC/Sort",
  render: (row) =>
    visibleRows[row.id]
      ? row.sortCode
      : mask(row.sortCode),
},
{
  key: "actions",
  header: "Actions",
  render: (row) => (
    <ActionButton
      type="view"
      iconOnly
      title={
        visibleRows[row.id]
          ? "Hide Details"
          : "Show Details"
      }
      onClick={() => toggleRowVisibility(String(row.id))}
    />
  ),
},
    // {
    //   key: "currency",
    //   header: "Currency",
    //   render: (row) => <span>{row.currency || "—"}</span>,
    // },
    // {
    //   key: "isDefault",
    //   header: "Default",
    //   render: (row) =>
    //     row.isDefault ? (
    //       <span className="text-green-600 font-semibold">Yes</span>
    //     ) : (
    //       "—"
    //     ),
    // },
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
  ];

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
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
          emptyMessage="No customer bank accounts found"
        />
      </div>
    </div>
  );
};

export default CustomerBankDetails;
