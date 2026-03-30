import React, { useState, useEffect } from "react";
import SupplierDetailView from "./SupplierDetailView";
import SupplierModal from "../../components/procurement/supply/SupplierModal";
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
import Tooltip from "../../components/Tooltip";

interface Props {}

const SupplierManagement: React.FC<Props> = () => {
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
  const supplierCodes = suppliers.map((s) => s.supplierCode || "");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPI, setSelectedPI] = useState<any | null>(null);

  const normalizeStatus = (status?: string) => {
    if (!status) return "active";
    const s = status.toLowerCase();
    if (s === "unactive" || s === "inactive") return "inactive";
    if (s === "active") return "active";
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
      const list = (res.data?.suppliers || []).map((s: any) => ({
        ...s,
        status: normalizeStatus(s.status),
      }));
      setSuppliers(list);
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
    if (!allSuppliers.length) await fetchAllSuppliers();
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
    } catch (err) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedSupplier(null);
  };

  const handleAddSupplier = () => {
    setEditSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;
    setLoading(true);
    const res = await getSupplierById(supplier.supplierId);
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

  const handleEditFromDetail = (supplier: Supplier) =>
    handleEditSupplier(supplier);

  const handleMakePayment = (supplier: Supplier) => {
    setSelectedPI(supplier);
    setPaymentModalOpen(true);
  };
  const handleMakeadvancePayment = (supplier: Supplier) => {
  setSelectedPI({ ...supplier, isAdvance: true });
  setPaymentModalOpen(true);
};
  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!supplier.supplierId) return;
    const confirm = window.confirm(
      `Are you sure you want to delete ${supplier.supplierName}?`,
    );
    if (!confirm) return;
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
  render: (s) => (
    <Tooltip content={s.supplierCode}>
      <span className="truncate max-w-[120px] block">
        {s.supplierCode || "—"}
      </span>
    </Tooltip>
  ),
},
    {
  key: "supplierName",
  header: "Supplier Name",
  align: "left",
  render: (s) => (
    <Tooltip content={s.supplierName}>
      <span className="truncate max-w-[160px] block">
        {s.supplierName || "—"}
      </span>
    </Tooltip>
  ),
},
    {
  key: "taxCategory",
  header: "Tax Category",
  align: "left",
  render: (s) => (
    <Tooltip content={s.taxCategory}>
      <span className="truncate max-w-[140px] block">
        {s.taxCategory || "—"}
      </span>
    </Tooltip>
  ),
},
   {
  key: "phoneNo",
  header: "Phone",
  align: "left",
  render: (s) => (
    <Tooltip content={s.phoneNo}>
      <span className="truncate max-w-[140px] block">
        {s.phoneNo || "—"}
      </span>
    </Tooltip>
  ),
},
    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      render: (s) =>
        s.tpin ? (
          <Tooltip content={s.tpin}>
            <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
              {s.tpin}
            </code>
          </Tooltip>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
{
  key: "currency",
  header: "Currency",
  align: "left",
  render: (s) => (
    <Tooltip content={s.currency}>
      <span className="text-xs px-2 py-1 rounded bg-row-hover text-main">
        {s.currency || "—"}
      </span>
    </Tooltip>
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
          <ActionMenu
            onEdit={() => handleEditSupplier(s)}
            onDelete={() => handleDeleteSupplier(s)}
            customActions={[
              { label: "Make Payment", onClick: () => handleMakePayment(s) },
              {label:"Make Advance Payment", onClick: () => handleMakeadvancePayment(s)}
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  /* ─── UI ─── */
  return (
    /*
     * KEY FIX: when in detail mode, remove p-8 and make container h-full
     * so SupplierDetailView (which uses h-full) fills exactly the available
     * space — no extra white space below the table.
     */
    <div
      className={
        viewMode === "detail" ? "h-full flex flex-col overflow-hidden" : "p-8"
      }
    >
      {viewMode === "table" ? (
        <Table
          columns={columns}
          data={suppliers}
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

      <SupplierModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditSupplier(null);
        }}
        onSubmit={handleSupplierSaved}
        initialData={editSupplier}
        isEditMode={!!editSupplier}
        existingSupplierCodes={supplierCodes}
      />

      {/* <SupplierPaymentModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentSupplier(null); }}
        supplierName={paymentSupplier?.supplierName}
        supplierId={paymentSupplier?.supplierId}
      /> */}
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
         
          referenceInvoice: selectedPI.isAdvance
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
