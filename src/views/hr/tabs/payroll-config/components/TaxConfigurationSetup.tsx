import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import {
  deleteTaxConfig,
  type TaxConfig,
} from "../../../../../api/payrollConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { useTaxConfigs } from "../hooks/useTaxConfigs";
import { openTaxConfigModal } from "../../../../../store/modalStore";

export function TaxConfigurationSetup() {
  const {
    rows,
    loading,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    fetchAll,
    fetchDetail,
  } = useTaxConfigs();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);



  const handleEdit = useCallback(
    async (row: TaxConfig) => {
      const detail = await fetchDetail(row.name);
      if (!detail) return;
      openTaxConfigModal(
  detail,
  true,
  {
    onSuccess: fetchAll,
  },
  {
    title: "Edit Tax Configuration",
  },
);
    },
    [fetchDetail],
  );

  const handleDelete = useCallback(
    async (row: TaxConfig) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.name}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteTaxConfig(row.name);
        showSuccess("Tax configuration deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<TaxConfig>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
        tooltip: (row) => row.name,
      },
      {
        key: "effective_from",
        header: "Tax Type",
        render: () => (
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            Income Tax Slab
          </span>
        ),
      },
      {
        key: "standard_tax_exemption_amount",
        header: "Value",
        render: (row) => (
          <span className="text-sm text-main">
            {row.standard_tax_exemption_amount != null
              ? row.standard_tax_exemption_amount
              : "—"}
          </span>
        ),
      },
      {
        key: "disabled",
        header: "Status",
        render: (row) => {
          const isActive = !row.disabled;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <ActionGroup>
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => handleEdit(row)}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              customActions={[
                {
                  label: "Delete",
                  onClick: () => handleDelete(row),
                  disabled: actionLoadingId === row.name,
                },
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleEdit, handleDelete],
  );

  return (
    <>
      <Table
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.name ?? ""}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Tax"
        onAdd={() =>
  openTaxConfigModal(
    null,
    false,
    {
      onSuccess: fetchAll,
    },
    {
      title: "New Tax Configuration",
    },
  )
}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50]}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        enableColumnSelector
        tableId="tax-configurations"
      />

      
    </>
  );
}
