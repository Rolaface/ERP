import React, { useState, useEffect } from "react";
import SupplierDetailView from "./SupplierDetailView";
import SupplierModal from "../../components/procurement/supply/SupplierModal";
import {
  getSupplierById,
  getSuppliers,
} from "../../api/procurement/supplierApi";
import { mapSupplierApi } from "../../types/Supply/supplierMapper";

import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import type { Supplier } from "../../types/Supply/supplier";
import type { SupplierFilters } from "../../api/procurement/supplierApi";

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SupplierFilters>({});

  const normalizeStatus = (status?: string) => {
    if (!status) return "active";

    const s = status.toLowerCase();

    if (s === "unactive" || s === "inactive") return "inactive";
    if (s === "active") return "active";

    return "active";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm || undefined,
      }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FETCH SUPPLIERS
  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const res = await getSuppliers(page, pageSize, filters);

      if (!res || res.status_code !== 200) {
        console.error("Failed to load suppliers");
        return;
      }

      const list = (res.data?.suppliers || []).map((s: any) => ({
        ...s,
        status: normalizeStatus(s.status),
      }));

      setSuppliers(list);

      setTotalPages(res.data?.pagination?.total_pages || 1);
      setTotalItems(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Error loading suppliers:", err);
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

      const list = (res.data?.suppliers || []).map((s: any) => ({
        ...s,
        status: normalizeStatus(s.status),
      }));

      setAllSuppliers(list);
    } catch (e) {
      console.error(e);
    }
  };

  const ensureAllSuppliers = async () => {
    if (!allSuppliers.length) {
      await fetchAllSuppliers();
    }
  };

  const handleRowClick = async (supplier: Supplier) => {
    const supplierId =
      supplier.supplierId ??
      (supplier as any)?.id ??
      (supplier as any)?.supplier_id;
    if (!supplierId) return;

    try {
      setLoading(true);

      // Ensure sidebar suppliers loaded
      await ensureAllSuppliers();

      //  Fetch selected supplier detail
      const res = await getSupplierById(supplierId);
      const mapped = mapSupplierApi(res.data || res);

      setEditSupplier(mapped);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      console.error("Failed to load supplier detail");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedSupplier(null);
  };

  //  MODAL HANDLERS
  const handleAddSupplier = () => {
    setEditSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = async (supplier: Supplier) => {
    const supplierId =
      supplier.supplierId ??
      (supplier as any)?.id ??
      (supplier as any)?.supplier_id;
    if (!supplierId) return;

    setLoading(true);
    const res = await getSupplierById(supplierId);
    const mapped = mapSupplierApi(res.data || res);

    setEditSupplier(mapped);
    setShowModal(true);
    setLoading(false);
  };

  const handleSupplierSaved = async () => {
    await fetchSuppliers();
    setShowModal(false);
    setEditSupplier(null);
  };

  const handleEditFromDetail = (supplier: Supplier) => {
    handleEditSupplier(supplier);
  };

  //  TABLE COLUMNS (ENTERPRISE STYLE)
  const columns: Column<Supplier>[] = [
    { key: "supplierCode", header: "Code", align: "left" },

    { key: "supplierName", header: "Supplier Name", align: "left" },

    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      render: (s) =>
        s.tpin ? (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {s.tpin}
          </code>
        ) : (
          <span className="text-muted">—</span>
        ),
    },

    {
      key: "currency",
      header: "Currency",
      align: "left",
      render: (s) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {s.currency || "ZMW"}
        </code>
      ),
    },

    {
      key: "status",
      header: "Status",
      align: "left",
      render: (s) => <StatusBadge status={s.status || "active"} />,
    },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (s) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleRowClick(s)}
            iconOnly
          />
          <ActionButton
            type="edit"
            onClick={() => handleEditSupplier(s)}
            iconOnly
          />
        </ActionGroup>
      ),
    },
  ];

  //  UI
  return (
    <div className="p-8">
      {viewMode === "table" ? (
        <Table
          columns={columns}
          data={suppliers}
          showToolbar
          loading={loading}
          onRowClick={handleRowClick}
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

      {/* SUPPLIER MODAL */}
      <SupplierModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditSupplier(null);
        }}
        onSubmit={handleSupplierSaved}
        initialData={editSupplier}
        isEditMode={!!editSupplier}
      />
    </div>
  );
};

export default SupplierManagement;
