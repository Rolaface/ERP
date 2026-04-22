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
import PaymentEntryModal from "../../views/PaymentEntry/PaymentEntryModal";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";

type OutletContextType = {
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
};

interface Props {
  onAdd?: () => void;
}

const SupplierManagement: React.FC<Props> = ({ onAdd }) => {
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
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SupplierFilters>({});

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPI, setSelectedPI] = useState<any | null>(null);

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

    setAllSuppliers(list);
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
    setSelectedPI(supplier);
    setPaymentModalOpen(true);
  };

  const handleMakeAdvancePayment = (supplier: Supplier) => {
    setSelectedPI({ ...supplier, isAdvance: true });
    setPaymentModalOpen(true);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${supplier.supplierName}?`,
    );

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
      width: "160px",
      render: (supplier) => (
        <span className="font-medium whitespace-nowrap">
          {supplier.supplierId || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.supplierId || "-",
    },
    {
      key: "supplierName",
      header: "Supplier Name",
      align: "left",
      width: "280px",
      render: (supplier) => (
        <span className="truncate block font-medium">
          {supplier.supplierName || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.supplierName || "-",
    },
    {
      key: "taxCategory",
      header: "Tax Category",
      align: "left",
      width: "140px",
      render: (supplier) => (
        <span className="whitespace-nowrap">{supplier.taxCategory || "-"}</span>
      ),
      tooltip: (supplier) => supplier.taxCategory || "-",
    },
    {
      key: "phoneNo",
      header: "Phone",
      align: "left",
      width: "150px",
      render: (supplier) => (
        <span className="whitespace-nowrap">{supplier.phoneNo || "-"}</span>
      ),
      tooltip: (supplier) => supplier.phoneNo || "-",
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      width: "140px",
      render: (supplier) => (
        <span className="font-mono text-sm tabular-nums whitespace-nowrap">
          {supplier.tpin || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.tpin || "-",
    },
    {
      key: "currency",
      header: "Currency",
      align: "center",
      width: "90px",
      render: (supplier) => (
        <span className="text-xs font-medium whitespace-nowrap">
          {supplier.currency || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.currency || "-",
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "110px",
      render: (supplier) => (
        <StatusBadge status={supplier.status || "active"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "130px",
      render: (supplier) => (
        <div className="flex items-center justify-center gap-2">
          <ActionButton
            type="view"
            onClick={() => handleRowClick(supplier)}
            iconOnly
          />
          <ActionMenu
            onEdit={() => handleEditSupplier(supplier)}
            onDelete={() => handleDeleteSupplier(supplier)}
            customActions={[
              {
                label: "Make Payment",
                onClick: () => handleMakePayment(supplier),
              },
              {
                label: "Make Advance Payment",
                onClick: () => handleMakeAdvancePayment(supplier),
              },
            ]}
          />
        </div>
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
          data={allSuppliers}
          showToolbar
          loading={loading}
          onPageSizeChange={(size) => setPageSize(size)}
          pageSizeOptions={[10, 25, 50, 100]}
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableAdd
          addLabel="Add Supplier"
          onAdd={handleAddSupplier}
          enableColumnSelector
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

      <PaymentEntryModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPI(null);
        }}
        defaultValues={
          selectedPI
            ? {
                paymentType: "Pay",
                partyType: "Supplier",
                partyName: selectedPI.supplierName,
                partyId: selectedPI.supplierId,
                referenceName: selectedPI.isAdvance
                  ? `ADV-${selectedPI.supplierId}`
                  : undefined,
              }
            : undefined
        }
      />
    </div>
  );
};

export default SupplierManagement;
