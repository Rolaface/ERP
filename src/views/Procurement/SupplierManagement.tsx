import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SupplierDetailView from "./SupplierDetailView";
import {
  deleteSupplier,
  getSupplierById,
  getSuppliers,
} from "../../api/procurement/supplierApi";
import { mapSupplierApi } from "../../types/Supply/supplierMapper";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import type { Supplier } from "../../types/Supply/supplier";
import type { SupplierFilters } from "../../api/procurement/supplierApi";
import { showApiError, showSuccess } from "../../utils/alert";

import { openPaymentEntryModal } from "../../store/modalStore";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { fireManagedSwal } from "../../utils/swalManager";

type OutletContextType = {
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
};

interface Props {
  onAdd?: () => void;
}

const SUPPLIER_MODULE = "Supplier";
const PAYMENT_MODULE  = "Payment Entry";

const SupplierManagement: React.FC<Props> = ({ onAdd }) => {
   const { can } = usePermission();
  const { openSupplierCreate, openSupplierEdit } =
    useOutletContext<OutletContextType>();

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  const handleAddSupplier = () => {
    if (openSupplierCreate) {
      openSupplierCreate();
    } else if (onAdd) {
      onAdd();
    }
  };

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);



  const normalizeStatus = (status?: string) => {
    if (!status) return "inactive";

    const normalized = status.toLowerCase();

    if (["inactive", "unactive"].includes(normalized)) return "inactive";
    if (normalized === "active") return "active";

    return "inactive";
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const res = await getSuppliers(page, pageSize, filters);

      if (!res || res.status_code !== 200) return;

      const list = (res.data || []).map((supplier: any) => {
        const mapped = mapSupplierApi(supplier);

        return {
          ...mapped,
          status: normalizeStatus(mapped.status),
        };
      });

      setSuppliers(list);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSuppliers();
  }, [page, pageSize, filters]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.SUPPLIER_LIST, () => {
      fetchSuppliers();
    });
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchSuppliers]);

  const fetchAllSuppliers = async () => {
    try {
      const res = await getSuppliers(1, 1000);
      if (!res || res.status_code !== 200) return;

      const list = (res.data || []).map((supplier: any) =>
        mapSupplierApi(supplier)
      );

      setAllSuppliers(list);
    } catch (error) {
      console.error(error);
    }
  };

  const ensureAllSuppliers = async () => {
    if (!allSuppliers.length) {
      await fetchAllSuppliers();
    }
  };

  const handleRowClick = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;

    try {
      setLoading(true);
      await ensureAllSuppliers();

      const res = await getSupplierById(supplier.supplierId);

      const data = res?.message?.data;
      if (!data) return;

      const mapped = mapSupplierApi(data);
      setSelectedSupplier(mapped);
      setViewMode("detail");
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    setViewMode("table");
    setSelectedSupplier(null);
  };

  const handleEditSupplier = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;

    setLoading(true);

    const res = await getSupplierById(supplier.supplierId);
    const data = res?.message?.data; // ✅ FIX

    if (!data) {
      setLoading(false);
      return;
    }

    const mapped = mapSupplierApi(data);
    setLoading(false);

    openSupplierEdit(supplier.supplierId, mapped);
  };
  const handleEditFromDetail = (supplier: Supplier) => handleEditSupplier(supplier);

  const handleMakePayment = (supplier: Supplier) => {
    openPaymentEntryModal(
      {
        paymentType: "Pay",
        partyType: "Supplier",
        partyName: {
          label: supplier.supplierName,
          value: supplier.supplierId,
        },
        partyId: supplier.supplierId,
      },
      false,
      {
        onSuccess: () => fetchSuppliers(),
      }
    );
  };

  const handleMakeAdvancePayment = (supplier: Supplier) => {
    openPaymentEntryModal(
      {
        paymentType: "Pay",
        partyType: "Supplier",
        partyName: {
          label: supplier.supplierName,
          value: supplier.supplierId,
        },
        partyId: supplier.supplierId,
        referenceName: `ADV-${supplier.supplierId}`,
      },
      false,
      {
        onSuccess: () => fetchSuppliers(),
      }
    );
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
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

    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteSupplier(supplier.supplierId);
      showSuccess("Supplier deleted successfully");
      triggerRefresh(REFRESH_KEYS.SUPPLIER_LIST);
    } catch (err: any) {
      console.error("Delete failed", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: "supplierID",
      header: "ID",
      align: "left",
      render: (supplier) => (
         <div className="py-1.5">
        <span className="block text-sm">
          {supplier.supplierId || "-"}
        </span>
        </div>
        
      ),
      tooltip: (supplier) => supplier.supplierId || "-",
    },
    {
      key: "supplierName",
      header: "Name",
      align: "center",
      render: (supplier) => (
        <div className="py-1.5">
        <span className="block text-sm">
          {supplier.supplierName || "-"}
        </span>
        </div>
      ),
      tooltip: (supplier) => {
        const name = supplier.supplierName || "";
        return name.length > 20 ? name : undefined;
      },
    },
    {
      key: "taxCategory",
      header: "Tax Category",
      align: "center",
      render: (supplier) => (
        <div className="py-1.5">
          <span className="block text-sm">{supplier.taxCategory || "-"}</span>
        </div>
      ),
      tooltip: (supplier) => supplier.taxCategory || "-",
    },
    {
      key: "phoneNo",
      header: "Phone",
      align: "center",
      render: (supplier) => (
        <div className="py-1.5">
          <span className="block text-sm">{supplier.phoneNo || "-"}</span>
        </div>
      ),
      tooltip: (supplier) => supplier.phoneNo || "-",
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "center",
      render: (supplier) =>
        supplier.tpin ? (
          <code className="inline-flex max-w-full rounded bg-row-hover px-2 py-0.5 text-xs text-main">
            {supplier.tpin}
          </code>
        ) : (
          <div className="py-1.5">
            <span className="text-muted">-</span>
          </div>
        ),
      tooltip: (supplier) => supplier.tpin || "-",
    },
    {
      key: "currency",
      header: "Currency",
      align: "center",
      render: (supplier) => (
        <div className="py-1.5">
          <span className="inline-flex max-w-full  rounded bg-row-hover px-2 py-0.5 text-xs text-main">
            {supplier.currency || "-"}
          </span>
        </div>
      ),
      tooltip: (supplier) => supplier.currency || "-",
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (supplier) => (
        <div className="py-1.5">
          <StatusBadge status={supplier.status || "active"} />
        </div>
      ),
    },
  {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (supplier) => (
        <ActionGroup>

          {/* View — always if can read */}
          <PermissionGate module={SUPPLIER_MODULE} action="read">
            <ActionButton
              type="view"
              onClick={() => handleRowClick(supplier)}
              iconOnly
            />
          </PermissionGate>

          {/* Edit — needs write */}
          <PermissionGate module={SUPPLIER_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => { e?.stopPropagation(); handleEditSupplier(supplier); }}
              iconOnly
              title="Edit Supplier"
            />
          </PermissionGate>

          <ActionMenu
            // Delete — needs delete
            {...(can(SUPPLIER_MODULE, "delete")
              ? { onDelete: () => handleDeleteSupplier(supplier) }
              : {})}
            customActions={[
              // Make Payment — needs Payment Entry create
              ...(can(PAYMENT_MODULE, "create")
                ? [{ label: "Make Payment", onClick: () => handleMakePayment(supplier) }]
                : []),
              // Advance Payment — needs Payment Entry create
              ...(can(PAYMENT_MODULE, "create")
                ? [{ label: "Make Advance Payment", onClick: () => handleMakeAdvancePayment(supplier) }]
                : []),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div
      className={
        viewMode === "detail"
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "h-full min-h-0"
      }
    >
      {viewMode === "table" ? (
        <Table
          columns={columns}
          data={suppliers}
          tableId="supplier-management"
          showToolbar
          loading={loading}
          onPageSizeChange={(size) => setPageSize(size)}
          pageSizeOptions={[10, 25, 50, 100]}
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableAdd={can(SUPPLIER_MODULE, "create")} 
          addLabel="Add Supplier"
          onAdd={handleAddSupplier}
          enableColumnSelector
          enableExport={can(SUPPLIER_MODULE, "export")}  
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      ) : selectedSupplier ? (
        <SupplierDetailView
          supplier={selectedSupplier}
          suppliers={allSuppliers}
          onBack={handleBack}
          onSupplierSelect={handleRowClick}
          onEdit={handleEditFromDetail}
        />
      ) : null}


    </div>
  );
};

export default SupplierManagement;
