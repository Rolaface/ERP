import React from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { FaExchangeAlt } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { openCurrencyExchangeModal } from "../../store/modalStore";
import {
  useCurrencyConversion,
  type CurrencyConversionPayload,
} from "../../hooks/useCurrencyConversion";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
  showConfirm,
} from "../../utils/alert";

// Component

const CurrencyConversion: React.FC = () => {
  const {
    data,
    loading,
    pagination,
    setPagination,
    search,
    setSearch,
    addConversion,
    updateConversion,
    actionLoading,
    deleteConversion,
  } = useCurrencyConversion();

  // ── Handlers ─────────────────────────────────
  const handleAdd = () =>
    openCurrencyExchangeModal(null, false, {
      onSuccess: async (payload: any) => {
        await addConversion(payload);
      },
    });
  const handleEdit = (row: CurrencyConversionPayload) =>
    openCurrencyExchangeModal(row, true, {
      onSuccess: async (payload: any) => {
        await updateConversion(payload);
      },
    });
  const handleSearch = (q: string) => {
    setSearch(q);
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      pageSize: size,
    }));
  };
  // ── Columns ───────────────────────────────────

  const columns: Column<CurrencyConversionPayload>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "fromCurrency",
      header: "Currency Pair",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <span>{row.fromCurrency}</span>
          <FaExchangeAlt className="text-primary text-[10px]" />
          <span>{row.toCurrency}</span>
        </div>
      ),
    },
    {
      key: "exchangeRate",
      header: "Exchange Rate",
      render: (row) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold">
          {row.exchangeRate.toLocaleString()}
        </code>
      ),
    },
    {
      key: "isBuying",
      header: "Purpose",
      render: (row) => (
        <div className="flex gap-1">
          {row.isBuying && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-medium">
              Buy
            </span>
          )}
          {row.isSelling && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-medium">
              Sell
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (row) =>
        row.createdAt ? (
          <span className="text-xs text-muted">
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
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
          {/* ── Edit button — inline, outside menu ── */}
          <ActionButton type="edit" onClick={() => handleEdit(row)} iconOnly />

          {/* ── Delete inside menu ── */}
          <ActionMenu
            customActions={[
              {
                label: "Delete",
                onClick: async () => {
                  if (actionLoading) return;
                  const confirmed = await showConfirm(
                    "Do you want to delete this record?",
                  );
                  if (!confirmed) return;
                  try {
                    showLoading("Deleting...");
                    const res = await deleteConversion(row.id);
                    closeSwal();
                    const backend = res?.message;
                    if (
                      !backend ||
                      backend.status === "error" ||
                      backend.status_code >= 400
                    ) {
                      showApiError(res);
                      return;
                    }
                    showSuccess(backend.message);
                  } catch (err) {
                    closeSwal();
                    showApiError(err);
                  }
                },
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaExchangeAlt className="text-primary" />
          Currency Exchange
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={data}
        loading={loading}
        enableColumnSelector
        tableId="currency-exchange"
        rowKey={(r) => r.id}
        showToolbar
        enableAdd
        addLabel="Add Currency Exchange"
        onAdd={handleAdd}
        searchValue={search}
        onSearch={handleSearch}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default CurrencyConversion;
