import { useCallback, useMemo, useState, useEffect } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import {
  deleteTaxConfig,
  updateTaxConfig,
  type TaxConfig,
} from "../../../../../api/payrollConfigApi";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../../store/dataRefreshStore";
import { useTaxConfigs } from "../hooks/useTaxConfigs";
import { openTaxConfigModal } from "../../../../../store/modalStore";
import { showApiError } from "../../../../../utils/alert";
import { parseFrappeError } from "../../leave-config/hooks/parseFrappeError";
import { ACTION_ICONS } from "../../../../../components/UI_Utils/statusActionIcons";

const formatDate = (date: string | Date) => {
  if (!date) return "";

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }

  // Date object — use local methods
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

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

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore(
    (state) => state.subscribeToRefresh,
  );

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(
      REFRESH_KEYS.TAX_CONFIGURATION_LIST,
      () => {
        fetchAll();
      },
    );
    return unsubscribe;
  }, [subscribeToRefresh, fetchAll]);

  const handleEdit = useCallback(
    async (row: TaxConfig) => {
      const detail = await fetchDetail(row.name);
      if (!detail) return;
      openTaxConfigModal(
        detail,
        true,
        {
          onSuccess: () => {
            triggerRefresh(REFRESH_KEYS.TAX_CONFIGURATION_LIST);
          },
        },
        { title: "Edit Tax Configuration" },
      );
    },
    [fetchDetail, triggerRefresh],
  );

  const handleDelete = useCallback(
    async (row: TaxConfig) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.name}"?`,
          loadingText: "Deleting Tax Configuration...",
          successMessage: "Tax configuration deleted",
          action: async () => {
            await deleteTaxConfig(row.name!);
          },
        });
        if (deleted) triggerRefresh(REFRESH_KEYS.TAX_CONFIGURATION_LIST);
      } finally {
        setActionLoadingId(null);
      }
    },
    [triggerRefresh],
  );

   const handleStatus = useCallback(
      async (row: TaxConfig) => {
        if (!row.name) return;
        try {
          setActionLoadingId(row.name);
          
          const newStatus = row.disabled ? 0 : 1;
          await updateTaxConfig(row.name, { disabled: newStatus });
          fetchAll();
        } catch (error) {
          showApiError(parseFrappeError(error) || "Failed to update status.");
         } finally {
          setActionLoadingId(null);
        }
      },
      [fetchAll]
    );

  const columns: Column<TaxConfig>[] = useMemo(
    () => [
      {
        key: "effective_from",
       align:"center",
        header: "Effictive From",
        render: (row) => (
          <span className="text-sm text-main">
            {row.effective_from ? formatDate(row.effective_from) : "—"}
          </span>
        ),
      },
      {
        key: "name",
        header: "Name",
        align:"center",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
        tooltip: (row) => row.name,
      },
      // {
      //   key: "effective_from",
      //   header: "Tax Type",
      //   render: () => (
      //     <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
      //       Income Tax Slab
      //     </span>
      //   ),
      // },

      {
        key: "standard_tax_exemption_amount",
         align:"center",
        header: "Tax Exemption Amount",
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
         align:"center",
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
              {isActive ? "Enabled" : "Disabled"}
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
              type="view"
              iconOnly
              onClick={() => handleEdit(row)}
            />
            <ActionMenu
  onDelete={() => handleDelete(row)}
  customActions={[
    {
      label: row.disabled ? "Enable" : "Disable",
      icon: row.disabled
        ? ACTION_ICONS.ENABLE
        : ACTION_ICONS.DISABLE,
      onClick: () => handleStatus(row),
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
    <ModalTable
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
            onSuccess: () => {
              triggerRefresh(REFRESH_KEYS.TAX_CONFIGURATION_LIST);
            },
          },
          { title: "New Tax Configuration" },
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
  );
}
