// CurrencyConversion.tsx
import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { FaExchangeAlt } from "react-icons/fa";
import {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import CurrencyConversionModal from "../../components/currencyconversion/CurrencyConversionModal";
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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const CurrencyConversion: React.FC = () => {
  const { data, loading, addConversion, updateConversion, deleteConversion, } =
    useCurrencyConversion();

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<CurrencyConversionPayload | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const totalItems = data.length;
const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = data.slice(
  (page - 1) * pageSize,
  page * pageSize
);

 


  // ── Handlers ─────────────────────────────────

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (row: CurrencyConversionPayload) => {
    setEditData(row);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleSave = async (payload: any) => {
    if (payload.id) {
      return await updateConversion(payload);
    } else {
      return await addConversion(payload);
    }
  };
  // ── Columns ───────────────────────────────────

  const columns: Column<CurrencyConversionPayload>[] = [
    {
      key: "date",
      header: "Date",
    },
    {
      key: "fromCurrency",
      header: "From Currency",
    },
    {
      key: "toCurrency",
      header: "To Currency",
    },
    {
      key: "exchangeRate",
      header: "Exchange Rate",
    },
    {
      key: "isBuying",
      header: "Buying",
      align: "center",
      render: (row) => (
        <span
          className={
            row.isBuying ? "text-green-600 font-medium" : "text-gray-400"
          }
        >
          {row.isBuying ? "✓" : "—"}
        </span>
      ),
    },
    {
      key: "isSelling",
      header: "Selling",
      align: "center",
      render: (row) => (
        <span
          className={
            row.isSelling ? "text-green-600 font-medium" : "text-gray-400"
          }
        >
          {row.isSelling ? "✓" : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (row) => row.createdAt || "—",
    },
    {
      key: "modifiedAt",
      header: "Modified At",
      render: (row) => row.modifiedAt || "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionMenu
            customActions={[
              {
                label: "Edit",
                onClick: () => handleEdit(row),
              },
              {
                label: "Delete",
                onClick: async () => {
                  const confirm = await showConfirm(
                    "Do you want to delete this record?",
                  );
                  if (!confirm) return;

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

                    showSuccess(backend.message); // ✅ dynamic from backend
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
          Currency Exchange List
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        rowKey={(r) => r.id}
        showToolbar
        enableAdd
        addLabel="Add Currency Exchange"
        onAdd={handleAdd}
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
          currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}

  onPageChange={setPage}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setPage(1);
  }}
        

        
      />

      {/* MODAL */}
      <CurrencyConversionModal
        isOpen={showModal}
        onClose={handleClose}
        onSave={handleSave}
        editData={editData}
      />
    </div>
  );
};

export default CurrencyConversion;
