import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CustomerDetailView from "./CustomerDetailView";
import { openPaymentEntryModal } from "../../store/modalStore";
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

import { fireManagedSwal } from "../../utils/swalManager";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import { Copy } from "lucide-react";

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
    openPaymentEntryModal(
      {
        paymentType: "Receive",
        partyType: "Customer",
        partyName: customer.name,
        partyId: customer.id,
      },
      false,
      {
        onSuccess: async () => {
          await handleCustomerSaved();
        },
      }
    );
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
      render: (customer) => {
        const id = customer.id || "";
        const shortId = id ? `******${id.slice(-4)}` : "-";

        const handleCopy = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(id);
        };

        return (
          <div className="flex items-center justify-start gap-1 group">
            <span className="font-mono text-sm">
              {shortId}
            </span>

            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-blue-600"
              title="Copy full Customer ID"
            >
              <Copy size={14} />
            </button>
          </div>
        );
      },
      tooltip: (customer) => customer.id,
    },
    {
      key: "name",
      header: "Name",
      align: "left",
      width: "280px",
      render: (customer) => (
        <span className="cursor-pointer font-medium block">
          {customer.name}
        </span>
      ),
      tooltip: (customer) => customer.name,
    },
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (customer) => (
        <span className="text-muted whitespace-nowrap">
          {customer.type ?? "-"}
        </span>
      ),
      tooltip: (customer) => customer.type ?? "-",
    },
    {
      key: "tpin",
      header: "TPIN",
      align: "left",
      render: (customer) => (
       <span className="font-mono text-sm tabular-nums whitespace-nowrap block text-left">
          {customer.tpin}
        </span>
      ),
      tooltip: (customer) => customer.tpin,
    },
    {
      key: "customerTaxCategory",
      header: "Tax Category",
      align: "left",
      render: (customer) => (
        <span className="whitespace-nowrap">
          {customer.customerTaxCategory ?? "-"}
        </span>
      ),
      tooltip: (customer) => customer.customerTaxCategory ?? "-",
    },
    {
      key: "currency",
      header: "Currency",
      align: "center",
      render: (customer) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main whitespace-nowrap block text-center">
          {customer.currency}
        </code>
      ),
      tooltip: (customer) => customer.currency,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (customer) => (
        <span
          className={`inline-flex items-center justify-center text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${customer.status === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
            }`}
        >
          {customer.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (customer) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleRowClick(customer)}
            iconOnly
          />

          <ActionButton
            type="edit"
            onClick={(e) => handleEditCustomer(customer.id, e as any)}
            iconOnly
            title="Edit Customer"
          />

          <ActionMenu
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
          tableId="customer-management"
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


    </div>
  );
};

export default CustomerManagement;
