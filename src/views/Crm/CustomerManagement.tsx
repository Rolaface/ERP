import React, { useMemo, useState, useEffect } from "react";
import CustomerDetailView from "./CustomerDetailView";
import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../../utils/alert";
import {
  getAllCustomers,
  deleteCustomerById,
  getCustomerByCustomerCode,
} from "../../api/customerApi";

import CustomerModal from "../../components/crm/CustomerModal";

import type { CustomerSummary, CustomerDetail } from "../../types/customer";

import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import Swal from "sweetalert2";

interface Props {
  onAdd: () => void;
}

function exportToCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",") + "\n";
  const body = rows
    .map((row) =>
      Object.values(row)
        .map((s) => `"${String(s ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CustomerManagement: React.FC<Props> = ({ onAdd }) => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [custLoading, setCustLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerDetail | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [taxCategory, setTaxCategory] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchCustomers = async () => {
    try {
      setCustLoading(true);

      const response = await getAllCustomers(
        page,
        pageSize,
        taxCategory || undefined,
      );

      setCustomers(response.data);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total || 1);
    } catch (error) {
      console.error("Error loading customers:", error);
      showApiError(error);
    } finally {
      setCustLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize, taxCategory, searchTerm, typeFilter]);

  const fetchAllCustomers = async () => {
    try {
      const resp = await getAllCustomers(1, 1000, taxCategory || undefined);
      setAllCustomers(resp.data || []);
    } catch (err) {
      console.error("Error loading all customers:", err);
    }
  };

  const ensureAllCustomers = async () => {
    if (!allCustomers.length) {
      await fetchAllCustomers();
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = (searchTerm ?? "").trim().toLowerCase();
    const tf = (typeFilter ?? "").trim().toLowerCase();

    return customers.filter((c) => {
      if (q) {
        const hay = [
          c.id,
          c.name,
          c.displayName,
          c.email,
          c.mobile,
          c.customerTaxCategory,
          c.currency,
          c.tpin,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (tf) {
        const t = String(c.type ?? "").toLowerCase();
        if (t !== tf) return false;
      }

      return true;
    });
  }, [customers, searchTerm, typeFilter]);

  const handleExportCsv = async () => {
    try {
      showLoading("Preparing CSV...");
      const resp = await getAllCustomers(1, 5000, taxCategory || undefined);
      const rows: CustomerSummary[] = Array.isArray(resp?.data)
        ? resp.data
        : [];
      const q = (searchTerm ?? "").trim().toLowerCase();
      const tf = (typeFilter ?? "").trim().toLowerCase();

      const filtered = rows.filter((c) => {
        if (q) {
          const hay = [
            c.id,
            c.name,
            c.displayName,
            c.email,
            c.mobile,
            c.customerTaxCategory,
            c.currency,
            c.tpin,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }

        if (tf) {
          const t = String(c.type ?? "").toLowerCase();
          if (t !== tf) return false;
        }

        return true;
      });

      const exportRows = filtered.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        taxCategory: c.customerTaxCategory,
        currency: c.currency,
        onboardingBalance: c.onboardingBalance,
        status: c.status,
        email: c.email,
        mobile: c.mobile,
        tpin: c.tpin,
      }));

      exportToCsv(
        exportRows,
        taxCategory
          ? `customers_${String(taxCategory).replace(/\s+/g, "_")}.csv`
          : "customers_all.csv",
      );
      closeSwal();
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDelete = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete customer ${customerId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Customer...");

      await deleteCustomerById(customerId);

      closeSwal();

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));

      showSuccess("Customer deleted successfully.");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleAddCustomer = () => {
    setEditCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const customer = await getCustomerByCustomerCode(id);
      setEditCustomer(customer.data ?? customer);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      showApiError(error);
    }
  };

  const handleCustomerSaved = async () => {
    setShowModal(false);
    setEditCustomer(null);
    await fetchCustomers();
    showSuccess(editCustomer ? "Customer updated!" : "Customer created!");
  };

  const handleRowClick = async (customer: CustomerSummary) => {
    try {
      setCustLoading(true);

      //  Ensure sidebar data loaded
      await ensureAllCustomers();

      //  Fetch full customer detail
      const res = await getCustomerByCustomerCode(customer.id);
      const fullCustomer = res.data ?? res;

      setSelectedCustomer(fullCustomer);
      setViewMode("detail");
    } catch (err) {
      console.error("Failed to load customer detail:", err);
      showApiError(err);
    } finally {
      setCustLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedCustomer(null);
  };

  // columns definition for Table component
  const columns: Column<CustomerSummary>[] = [
    { key: "id", header: "Customer ID", align: "left" },
    { key: "name", header: "Name", align: "left" },
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (c: CustomerSummary) => <StatusBadge status={c.type} />,
    },
    {
      key: "customerTaxCategory",
      header: "TaxCategory",
      align: "left",
      render: (c: CustomerSummary) => (
        <StatusBadge status={c.customerTaxCategory} />
      ),
    },
    {
      key: "currency",
      header: "Currency",
      align: "left",
      render: (c: CustomerSummary) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {c.currency}
        </code>
      ),
    },
    {
      key: "onboardingBalance",
      header: "Onboard Balance",
      align: "right",
      render: (c: CustomerSummary) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {c.onboardingBalance}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (c: CustomerSummary) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleRowClick(c)}
            iconOnly
          />
          <ActionButton
            type="edit"
            onClick={(e) => handleEditCustomer(c.id, e as any)}
            iconOnly
          />
          <ActionButton
            type="delete"
            onClick={(e) => handleDelete(c.id, e as any)}
            iconOnly
            variant="danger"
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      {viewMode === "table" ? (
        <>
          <Table
            columns={columns}
            data={filteredCustomers}
            showToolbar
            loading={custLoading || initialLoad}
            onPageSizeChange={(size) => setPageSize(size)}
            pageSizeOptions={[10, 25, 50, 100]}
            searchValue={searchTerm}
            onSearch={setSearchTerm}
            enableExport
            onExport={handleExportCsv}
            enableAdd
            addLabel="Add Customer"
            onAdd={handleAddCustomer}
            enableColumnSelector
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            extraFilters={
              <div className="flex items-center gap-3 flex-wrap">
                <FilterSelect
                  value={taxCategory}
                  onChange={(e) => {
                    setPage(1);
                    setAllCustomers([]);
                    setTaxCategory(e.target.value);
                  }}
                  options={[
                    { label: "All", value: "" },
                    { label: "Non-export", value: "Non-Export" },
                    { label: "Export", value: "Export" },
                    { label: "Lpo", value: "LPO" },
                  ]}
                />

                <FilterSelect
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { label: "Company", value: "Company" },
                    { label: "Individual", value: "Individual" },
                  ]}
                />
              </div>
            }
          />
        </>
      ) : selectedCustomer ? (
        <CustomerDetailView
          customer={selectedCustomer}
          customers={allCustomers}
          onBack={handleBack}
          onCustomerSelect={handleRowClick}
          onAdd={onAdd}
          onEdit={handleEditCustomer}
        />
      ) : null}

      <CustomerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditCustomer(null);
        }}
        onSubmit={handleCustomerSaved}
        initialData={editCustomer}
        isEditMode={!!editCustomer}
      />
    </div>
  );
};

export default CustomerManagement;
