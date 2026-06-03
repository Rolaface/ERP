import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import SupplierDetailView from "./SupplierDetailView";
import {
  deleteSupplier,
  getSupplierById,
  getSuppliers,updateSupplierStatus
} from "../../api/procurement/supplierApi";
import { mapSupplierApi } from "../../types/Supply/supplierMapper";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import type { Supplier } from "../../types/Supply/supplier";
import type { SupplierFilters } from "../../api/procurement/supplierApi";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { openPaymentEntryModal } from "../../store/modalStore";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { fireManagedSwal } from "../../utils/swalManager";
import { updateEntityStatus } from "../../hooks/statusManager";

import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutletContextType = {
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
};

interface Props {
  onAdd?: () => void;
}

const SUPPLIER_MODULE = "Supplier";
const PAYMENT_MODULE = "Payment Entry";

// ─── Component ────────────────────────────────────────────────────────────────

const SupplierManagement: React.FC<Props> = ({ onAdd }) => {
  const { can } = usePermission();
  const { openSupplierCreate, openSupplierEdit } =
    useOutletContext<OutletContextType>();
  const mountedRef = useRef(true);

  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  // ── Data state — split loading so page changes don't flash skeleton
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Detail view
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SupplierFilters>({});

  // ── Reset page on search change (debounced → filters)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const normalizeStatus = (status?: string) => {
    if (!status) return "inactive";
    const normalized = status.toLowerCase();
    if (["inactive", "unactive"].includes(normalized)) return "inactive";
    if (normalized === "active") return "active";
    return "inactive";
  };

  // ── Fetch — memoized with useCallback (matches Customer pattern)
  const fetchSuppliers = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getSuppliers(page, pageSize, filters);

      if (!mountedRef.current) return;

      if (!res || res.status_code !== 200) {
        setSuppliers([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      const list = (res.data || []).map((supplier: any) => {
        const mapped = mapSupplierApi(supplier);
        return { ...mapped, status: normalizeStatus(mapped.status) };
      });

      setSuppliers(list);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err) {
      showApiError(err);
      setSuppliers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, filters]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchSuppliers();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchSuppliers();
  }, [page, pageSize, filters]);

  // Auto-refresh on external events
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.SUPPLIER_LIST, () => {
      fetchSuppliers();
    });
    return unsubscribe;
  }, [subscribeToRefresh, fetchSuppliers]);

  // ── All suppliers (for detail view navigation)
  const fetchAllSuppliers = useCallback(async () => {
    try {
      const res = await getSuppliers(1, 1000);
      if (!res || res.status_code !== 200) return;
      const list = (res.data || []).map((supplier: any) => mapSupplierApi(supplier));
      setAllSuppliers(list);
    } catch (error) {
      console.error("Error loading all suppliers:", error);
    }
  }, []);

  const ensureAllSuppliers = async () => {
    if (!allSuppliers.length) await fetchAllSuppliers();
  };

  // ── Action handlers
  const handleAddSupplier = () => {
    if (openSupplierCreate) openSupplierCreate();
    else if (onAdd) onAdd();
  };

  const handleMakePayment = (supplier: Supplier) => {
    openPaymentEntryModal(
      {
        paymentType: "Pay",
        partyType: "Supplier",
        partyName: { label: supplier.supplierName, value: supplier.supplierId },
        partyId: supplier.supplierId,
      },
      false,
      { onSuccess: () => fetchSuppliers() },
    );
  };

  const handleMakeAdvancePayment = (supplier: Supplier) => {
    openPaymentEntryModal(
      {
        paymentType: "Pay",
        partyType: "Supplier",
        partyName: { label: supplier.supplierName, value: supplier.supplierId },
        partyId: supplier.supplierId,
        referenceName: `ADV-${supplier.supplierId}`,
      },
      false,
      { onSuccess: () => fetchSuppliers() },
    );
  };

  const handleDeleteSupplier = async (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supplier.supplierId) return;

    const confirmed = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete supplier ${supplier.supplierId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirmed.isConfirmed) return;

    try {
      setIsFetching(true);
      await deleteSupplier(supplier.supplierId);
      showSuccess("Supplier deleted successfully");
      triggerRefresh(REFRESH_KEYS.SUPPLIER_LIST);
    } catch (err) {
      console.error("Delete failed", err);
      showApiError(err);
    } finally {
      setIsFetching(false);
    }
  };
  const handleSupplierStatusChange = async (
  supplier: Supplier,
  action: "active" | "inactive",
) => {
  if (!supplier.supplierId) return;

  await updateEntityStatus(supplier.supplierId, {
    entityName: "Supplier",
    action,
    updateFn: updateSupplierStatus,
    onSuccess: () => {
      triggerRefresh(REFRESH_KEYS.SUPPLIER_LIST);
    },
  });
};

  const handleEditSupplier = async (supplier: Supplier, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!supplier.supplierId) return;

    setIsFetching(true);
    try {
      const res = await getSupplierById(supplier.supplierId);
      const data = res?.message?.data;
      if (!data) return;
      const mapped = mapSupplierApi(data);
      openSupplierEdit(supplier.supplierId, mapped);
    } finally {
      setIsFetching(false);
    }
  };

  const handleRowClick = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;

    try {
      setIsFetching(true);
      await ensureAllSuppliers();

      const res = await getSupplierById(supplier.supplierId);
      const data = res?.message?.data;
      if (!data) return;

      const mapped = mapSupplierApi(data);
      setSelectedSupplier(mapped);
      setViewMode("detail");
    } catch (error) {
      showApiError(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDisableSupplier = async (
  supplierId: string,
  e: React.MouseEvent,
) => {
  e.stopPropagation();

  await updateEntityStatus(supplierId, {
    entityName: "Supplier",
    action: "inactive",
    updateFn: updateSupplierStatus,
    onSuccess: () => {
      triggerRefresh(REFRESH_KEYS.SUPPLIER_LIST);
    },
  });
};

const handleEnableSupplier = async (
  supplierId: string,
  e: React.MouseEvent,
) => {
  e.stopPropagation();

  await updateEntityStatus(supplierId, {
    entityName: "Supplier",
    action: "active",
    updateFn: updateSupplierStatus,
    onSuccess: () => {
      triggerRefresh(REFRESH_KEYS.SUPPLIER_LIST);
    },
  });
};
  const handleExportCSV = async () => {
    try {
      showLoading("Exporting suppliers...");

      let allData: Supplier[] = [];
      let currentPage = 1;
      let totalPagesLocal = 1;

      do {
        const res = await getSuppliers(currentPage, 100, filters);
        if (res?.status_code === 200) {
          const mapped = (res.data || []).map((s: any) => {
            const m = mapSupplierApi(s);
            return { ...m, status: normalizeStatus(m.status) };
          });
          allData = [...allData, ...mapped];
          totalPagesLocal = res.pagination?.total_pages || 1;
        }
        currentPage++;
      } while (currentPage <= totalPagesLocal);

      if (!allData.length) {
        closeSwal();
        showApiError("No suppliers to export");
        return;
      }

      const headers = ["Supplier ID", "Name", "Tax Category", "Phone", "TPIN", "Currency", "Status"];
      const rows = allData.map((s) => [
        s.supplierId ?? "",
        s.supplierName ?? "",
        s.taxCategory ?? "",
        s.phoneNo ?? "",
        s.tpin ?? "",
        s.currency ?? "",
        s.status ?? "",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Suppliers_Export.csv";
      link.click();
      URL.revokeObjectURL(url);

      closeSwal();
      showSuccess("CSV exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedSupplier(null);
  };

  const columns: Column<Supplier>[] = useMemo(
    () => [
      {
        key: "supplierID",
        header: "Supplier ID",
        align: "left",
        render: (supplier) => (
          <span className="font-medium whitespace-nowrap">
            {supplier.supplierId ?? "—"}
          </span>
        ),
        tooltip: (supplier) => supplier.supplierId,
      },
      {
        key: "supplierName",
        header: "Name",
        align: "left",
        render: (supplier) => (
          <span className="font-medium block">{supplier.supplierName ?? "—"}</span>
        ),
        tooltip: (supplier) => supplier.supplierName,
      },
      {
        key: "taxCategory",
        header: "Tax Category",
        align: "left",
        render: (supplier) => (
          <span className="whitespace-nowrap">{supplier.taxCategory ?? "—"}</span>
        ),
      },
      {
        key: "phoneNo",
        header: "Phone",
        align: "left",
        render: (supplier) => (
          <span className="text-muted whitespace-nowrap">
            {supplier.phoneNo ?? "—"}
          </span>
        ),
      },
      {
        key: "tpin",
        header: "TPIN",
        align: "left",
        render: (supplier) => (
          <span className="font-mono text-sm tabular-nums whitespace-nowrap">
            {supplier.tpin ?? "—"}
          </span>
        ),
        tooltip: (supplier) => supplier.tpin,
      },
      {
        key: "currency",
        header: "Currency",
        align: "center",
        render: (supplier) => (
          <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {supplier.currency ?? "—"}
          </code>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (supplier) => (
          <span
            className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${supplier.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
              }`}
          >
            {supplier.status === "active" ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (supplier) => (
          <ActionGroup>
            <PermissionGate module={SUPPLIER_MODULE} action="read">
              <ActionButton
                type="view"
                onClick={() => handleRowClick(supplier)}
                iconOnly
              />
            </PermissionGate>

            <PermissionGate module={SUPPLIER_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => handleEditSupplier(supplier, e as any)}
                iconOnly
                title="Edit Supplier"
              />
            </PermissionGate>

            <ActionMenu
  {...(can(SUPPLIER_MODULE, "delete")
    ? { onDelete: (e) => handleDeleteSupplier(supplier, e as any) }
    : {})}

  onDisable={
    supplier.status === "active"
      ? (e) =>
          handleDisableSupplier(
            supplier.supplierId!,
            e as any,
          )
      : undefined
  }

  onEnable={
    supplier.status === "inactive"
      ? (e) =>
          handleEnableSupplier(
            supplier.supplierId!,
            e as any,
          )
      : undefined
  }

  customActions={[
    ...(can(PAYMENT_MODULE, "create")
      ? [
          {
            label: "Make Payment",
             icon: ACTION_ICONS.ADVANCE_PAYMENT,
            onClick: () => handleMakePayment(supplier),
          },
        ]
      : []),
    ...(can(PAYMENT_MODULE, "create")
      ? [
          {
            label: "Make Advance Payment",
             icon: ACTION_ICONS.ADVANCE_PAYMENT,
            onClick: () => handleMakeAdvancePayment(supplier),
          },
        ]
      : []),
  ]}
/>
          </ActionGroup>
        ),
      },
    ],
    [can, handleRowClick, handleEditSupplier, handleDeleteSupplier, handleMakePayment, handleMakeAdvancePayment],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      {viewMode === "table" ? (
        <Table
          columns={columns}
          data={suppliers}
          tableId="supplier-management"
          rowKey={(r) => r.supplierId ?? ""}
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
          enableAdd={can(SUPPLIER_MODULE, "create")}
          addLabel="Add Supplier"
          onAdd={handleAddSupplier}
          enableColumnSelector
          enableExport={can(SUPPLIER_MODULE, "export")}
          onExport={handleExportCSV}
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
        />
      ) : selectedSupplier ? (
        <SupplierDetailView
          supplier={selectedSupplier}
          suppliers={allSuppliers}
          onBack={handleBack}
          onSupplierSelect={handleRowClick}
          onEdit={(s) => handleEditSupplier(s)}
        />
      ) : null}
    </div>
  );
};

export default SupplierManagement;