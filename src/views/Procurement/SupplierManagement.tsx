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
    if (!status) return "active";
    const normalized = status.toLowerCase();
    if (normalized === "unactive" || normalized === "inactive") {
      return "inactive";
    }
    if (normalized === "active") {
      return "active";
    }
    return "active";
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

      const list = (res.data?.suppliers || []).map((supplier: any) => ({
        ...supplier,
        status: normalizeStatus(supplier.status),
      }));

      setAllSuppliers(list);
      setTotalPages(res.data?.pagination?.total_pages || 1);
      setTotalItems(res.data?.pagination?.total || 0);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, pageSize, filters]);

  const fetchAllSuppliers = async () => {
    try {
      const res = await getSuppliers(1, 1000);
      if (!res || res.status_code !== 200) return;

      const list = (res.data?.suppliers || []).map((supplier: any) => ({
        ...supplier,
        status: normalizeStatus(supplier.status),
      }));

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
      const mapped = mapSupplierApi(res.data || res);
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
    const mapped = mapSupplierApi(res.data || res);
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
      await fetchSuppliers();
    } catch (err: any) {
      console.error("Delete failed", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: "supplierCode",
      header: "Code",
      align: "left",
      render: (supplier) => (
        <span className="block truncate text-sm">
          {supplier.supplierCode || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.supplierCode || "-",
    },
    {
      key: "supplierName",
      header: "Supplier Name",
      align: "left",
      render: (supplier) => (
        <span className="block truncate text-sm">
          {supplier.supplierName || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.supplierName || "-",
    },
    {
      key: "taxCategory",
      header: "Tax Category",
      align: "left",
      render: (supplier) => (
        <span className="block truncate text-sm">
          {supplier.taxCategory || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.taxCategory || "-",
    },
    {
      key: "phoneNo",
      header: "Phone",
      align: "left",
      render: (supplier) => (
        <span className="block truncate text-sm">
          {supplier.phoneNo || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.phoneNo || "-",
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      render: (supplier) =>
        supplier.tpin ? (
          <code className="inline-flex max-w-full truncate rounded bg-row-hover px-2 py-0.5 text-xs text-main">
            {supplier.tpin}
          </code>
        ) : (
          <span className="text-muted">-</span>
        ),
      tooltip: (supplier) => supplier.tpin || "-",
    },
    {
      key: "currency",
      header: "Currency",
      align: "left",
      render: (supplier) => (
        <span className="inline-flex max-w-full truncate rounded bg-row-hover px-2 py-0.5 text-xs text-main">
          {supplier.currency || "-"}
        </span>
      ),
      tooltip: (supplier) => supplier.currency || "-",
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (supplier) => <StatusBadge status={supplier.status || "active"} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (supplier) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleRowClick(supplier)}
            iconOnly
          />
          <ActionMenu
            onEdit={() => handleEditSupplier(supplier)}
            onDelete={() => handleDeleteSupplier(supplier)}
            customActions={[
              { label: "Make Payment", onClick: () => handleMakePayment(supplier) },
              {
                label: "Make Advance Payment",
                onClick: () => handleMakeAdvancePayment(supplier),
              },
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
