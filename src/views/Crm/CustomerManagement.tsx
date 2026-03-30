import React, { useState, useEffect } from "react";
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
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import Swal from "sweetalert2";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";
import Tooltip from "../../components/Tooltip";

interface Props {
  onAdd: () => void;
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<
    any | null
  >(null);

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
  }, [page, pageSize, taxCategory]);

  const fetchAllCustomers = async () => {
    try {
      const resp = await getAllCustomers(1, 1000, taxCategory);
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

  const handleMakePayment = (customer: CustomerSummary) => {
    setSelectedCustomerForPayment(customer);
    setPaymentModalOpen(true);
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

    {
  key: "id",
  header: "Customer ID",
  align: "left",
  render: (c: CustomerSummary) => (
    <Tooltip content={c.id}>
      <span className="cursor-pointer">{c.id}</span>
    </Tooltip>
  ),
},
{
  key: "name",
  header: "Name",
  align: "left",
  render: (c: CustomerSummary) => (
    <Tooltip content={c.name}>
      <span className="cursor-pointer">{c.name}</span>
    </Tooltip>
  ),
},
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (c: CustomerSummary) => (
        <Tooltip content={c.type ?? "—"}>
          <span>{c.type ?? "—"}</span>
        </Tooltip>
      ),
    },
    {
      key: "customerTaxCategory",
      header: "TaxCategory",
      align: "left",
      render: (c: CustomerSummary) => (
        <Tooltip content={c.customerTaxCategory ?? "—"}>
          <span>{c.customerTaxCategory ?? "—"}</span>
        </Tooltip>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      align: "left",
      render: (c: CustomerSummary) => (
        <Tooltip content={c.currency}>
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {c.currency}
          </code>
        </Tooltip>
      ),
    },
    {
      key: "onboardingBalance",
      header: "Onboard Balance",
      align: "right",
      render: (c: CustomerSummary) => (
        <Tooltip content={c.onboardingBalance}>
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {c.onboardingBalance}
          </code>
        </Tooltip>
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
          <ActionMenu
            onEdit={(e) => handleEditCustomer(c.id, e as any)}
            onDelete={(e) => handleDelete(c.id, e as any)}
            customActions={[
              {
                label: "Receive Payment",
                onClick: () => handleMakePayment(c),
              },
            ]}
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
            data={customers}
            showToolbar
            loading={custLoading || initialLoad}
            onPageSizeChange={(size) => setPageSize(size)}
            pageSizeOptions={[10, 25, 50, 100]}
            searchValue={searchTerm}
            onSearch={setSearchTerm}
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
              <div>
                <FilterSelect
                  value={taxCategory}
                  onChange={(e) => {
                    setPage(1);
                    setTaxCategory(e.target.value);
                  }}
                  options={[
                    { label: "Non-Export", value: "Non-Export" },
                    { label: "Export", value: "Export" },
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
      <PaymentEntryModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedCustomerForPayment(null);
        }}
        defaultValues={
          selectedCustomerForPayment
            ? {
                paymentType: "Receive",
                partyType: "Customer",
                partyName: selectedCustomerForPayment.name,
                partyId: selectedCustomerForPayment.id,
              }
            : undefined
        }
      />
    </div>
  );
};

export default CustomerManagement;
