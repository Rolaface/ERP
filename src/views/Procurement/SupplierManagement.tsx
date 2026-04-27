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
import { Copy } from "lucide-react";

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
      align: "center",
 render: (supplier) => {
  const id = supplier.supplierId || "";
  const shortId = id ? `--${id.slice(-4)}` : "-";

  return (
    <div className="flex items-center justify-center gap-1 group">
      <span className="font-mono text-sm">
        {shortId}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(id);
        }}
        className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-blue-500"
        title="Copy full ID"
      >
        <Copy size={14} />
      </button>
    </div>
  );
},
      tooltip: (supplier) => supplier.supplierId || "-",
    },
    {
      key: "supplierName",
      header: "Name",
      align: "center",
      maxWidth: "250px",
      render: (supplier) => (
        <span className="block truncate text-sm">
          {supplier.supplierName || "-"}
        </span>
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
        <span className="block truncate text-sm">{supplier.taxCategory || "-"}</span>
      ),
      tooltip: (supplier) => supplier.taxCategory || "-",
    },
    {
      key: "phoneNo",
      header: "Phone",
      align: "center",
      render: (supplier) => (
        <span className="block truncate text-sm">{supplier.phoneNo || "-"}</span>
      ),
      tooltip: (supplier) => supplier.phoneNo || "-",
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "center",
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
      align: "center",
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
      align: "center",
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

          <ActionButton
            type="edit"
            onClick={(e) => {
              e?.stopPropagation();
              handleEditSupplier(supplier);
            }}
            iconOnly
            title="Edit Supplier"
          />

          <ActionMenu
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


    </div>
  );
};

export default SupplierManagement;
