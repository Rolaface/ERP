import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CustomerDetailView from "./CustomerDetailView";
import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../../utils/alert";
import {
  deleteCustomerById,
  getAllCustomers,
  getCustomerByCustomerCode,
} from "../../api/customerApi";
import type { CustomerSummary, CustomerDetail } from "../../types/customer";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";
import { fireManagedSwal } from "../../utils/swalManager";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";

type OutletContextType = {
  openCustomerCreate: () => void;
  openCustomerEdit: (id: string, data: any) => void;
};

interface Props {
  onAdd: () => void;
}

const CustomerManagement: React.FC<Props> = ({ onAdd }) => {
  const { 
    openCustomerCreate, 
    openCustomerEdit
  } =
    useOutletContext<OutletContextType>();

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [custLoading, setCustLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [taxCategory, setTaxCategory] = useState<string>("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<
    CustomerSummary | null
  >(null);

const fetchCustomers = async () => {
  try {
    setCustLoading(true);

    const response = await getAllCustomers(
      page,
      pageSize,
      taxCategory || undefined
    );

    setCustomers(response?.data || []);
    setTotalPages(response?.pagination?.total_pages || 1);
    setTotalItems(response?.pagination?.total || 0);

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

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.CUSTOMER_LIST, () => {
      fetchCustomers();
    });
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchCustomers]);

  const fetchAllCustomers = async () => {
    try {
      const response = await getAllCustomers(1, 1000, taxCategory);
      setAllCustomers(response?.data || []);
    } catch (error) {
      console.error("Error loading all customers:", error);
    }
  };

  const ensureAllCustomers = async () => {
    if (!allCustomers.length) {
      await fetchAllCustomers();
    }
  };

  const handleAddCustomer = () => {
    openCustomerCreate();
  };

  const handleMakePayment = (customer: CustomerSummary) => {
    setSelectedCustomerForPayment(customer);
    setPaymentModalOpen(true);
  };

  const handleDelete = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete customer ${customerId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      showLoading("Deleting Customer...");
      await deleteCustomerById(customerId);
      closeSwal();
      triggerRefresh(REFRESH_KEYS.CUSTOMER_LIST);
      showSuccess("Customer deleted successfully.");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleEditCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      showLoading("Loading customer...");
      const customer = await getCustomerByCustomerCode(id);
      closeSwal();
      openCustomerEdit(id, customer.data ?? customer.message?.data ?? customer);
    } catch (error) {
      closeSwal();
      console.error("Failed to fetch customer:", error);
      showApiError(error);
    }
  };

  const handleCustomerSaved = async () => {
    await fetchCustomers();
  };

  const handleRowClick = async (customerOrId: CustomerSummary | string) => {
    try {
      setCustLoading(true);
      await ensureAllCustomers();

      const customerId =
        typeof customerOrId === "string" ? customerOrId : customerOrId.id;

      const response = await getCustomerByCustomerCode(customerId);
      const fullCustomer = response?.message?.data ?? response?.data;

      if (!fullCustomer) {
        throw new Error("Customer not found");
      }

      setSelectedCustomer(fullCustomer);
      setViewMode("detail");
    } catch (error) {
      console.error("Failed to load customer detail:", error);
      showApiError(error);
    } finally {
      setCustLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedCustomer(null);
  };

  const columns: Column<CustomerSummary>[] = [
    {
      key: "id",
      header: "Customer ID",
      align: "left",
      maxWidth: "120px",
      render: (customer) => (
        <span className="cursor-pointer block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      align: "left",
      maxWidth: "220px",
      render: (customer) => (
        <span className="cursor-pointer block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      align: "left",
      maxWidth: "100px",
      render: (customer) => (
        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.type ?? "-"}
        </span>
      ),
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      maxWidth: "100px",
      render: (customer) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.tpin}
        </code>
      ),
    },
    {
      key: "customerTaxCategory",
      header: "Tax Category",
      align: "left",
      maxWidth: "120px",
      render: (customer) => (
        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.customerTaxCategory ?? "-"}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      align: "left",
      maxWidth: "80px",
      render: (customer) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.currency}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      maxWidth: "90px",
      render: (customer) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.status}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "100px",
      render: (customer) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleRowClick(customer)}
            iconOnly
          />
          <ActionMenu
            onEdit={(e) => handleEditCustomer(customer.id, e as any)}
            onDelete={(e) => handleDelete(customer.id, e as any)}
            customActions={[
              {
                label: "Receive Payment",
                onClick: () => handleMakePayment(customer),
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div>
      {viewMode === "table" ? (
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
      ) : selectedCustomer ? (
        <CustomerDetailView
          customerId={selectedCustomer.id}
          customers={allCustomers}
          onBack={handleBack}
          onCustomerSelect={handleRowClick}
          onAdd={onAdd}
          onEdit={handleEditCustomer}
        />
      ) : null}

      <PaymentEntryModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedCustomerForPayment(null);
        }}
        onSuccess={async () => {
          setPaymentModalOpen(false);
          setSelectedCustomerForPayment(null);
          await handleCustomerSaved();
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
