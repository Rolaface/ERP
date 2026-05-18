import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  updateCustomerStatus,
} from "../../api/customerApi";
import type { CustomerSummary, CustomerDetail } from "../../types/customer";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { fireManagedSwal } from "../../utils/swalManager";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutletContextType = {
  openCustomerCreate: () => void;
  openCustomerEdit: (id: string, data: any) => void;
};

interface Props {
  onAdd: () => void;
}

const CUSTOMER_MODULE = "Customer";
const PAYMENT_MODULE = "Payment Entry";

// ─── Component ────────────────────────────────────────────────────────────────

const CustomerManagement: React.FC<Props> = ({ onAdd }) => {
  const { openCustomerCreate, openCustomerEdit } =
    useOutletContext<OutletContextType>();
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  // ── Data state — split loading so page changes don't flash skeleton
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Detail view
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [taxCategory, setTaxCategory] = useState("");

  // ── Reset page on filter/search change
  useEffect(() => { setPage(1); }, [searchTerm, taxCategory]);

  // ── Fetch — memoized with useCallback (fixes infinite loop risk)
  const fetchCustomers = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const response = await getAllCustomers(
        page,
        pageSize,
        taxCategory || undefined,
        searchTerm || undefined,
      );

      if (!mountedRef.current) return;

      setCustomers(response?.data || []);
      setTotalPages(response?.pagination?.total_pages || 1);
      setTotalItems(response?.pagination?.total || 0);
    } catch (error) {
      showApiError(error);
      setCustomers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, taxCategory, searchTerm]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchCustomers();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchCustomers();
  }, [page, pageSize, taxCategory, searchTerm]);

  // Auto-refresh on external events
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.CUSTOMER_LIST, () => {
      fetchCustomers();
    });
    return unsubscribe;
  }, [subscribeToRefresh, fetchCustomers]);

  // ── All customers (for detail view navigation)
  const fetchAllCustomers = useCallback(async () => {
    try {
      const response = await getAllCustomers(1, 1000, taxCategory, searchTerm);
      setAllCustomers(response?.data || []);
    } catch (error) {
      console.error("Error loading all customers:", error);
    }
  }, [taxCategory, searchTerm]);

  const ensureAllCustomers = async () => {
    if (!allCustomers.length) await fetchAllCustomers();
  };

  // ── Action handlers
  const handleAddCustomer = () => openCustomerCreate();

  const handleMakePayment = (customer: CustomerSummary) => {
    openPaymentEntryModal(
      {
        paymentType: "Receive",
        partyType: "Customer",
        partyName: customer.name,
        partyId: customer.id,
      },
      false,
      { onSuccess: async () => fetchCustomers() },
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

    if (!confirm.isConfirmed) return;

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
      showApiError(error);
    }
  };

  const handleRowClick = async (customerOrId: CustomerSummary | string) => {
    try {
      setIsFetching(true);
      await ensureAllCustomers();

      const customerId =
        typeof customerOrId === "string" ? customerOrId : customerOrId.id;

      const response = await getCustomerByCustomerCode(customerId);
      const fullCustomer = response?.message?.data ?? response?.data;

      if (!fullCustomer) throw new Error("Customer not found");

      setSelectedCustomer(fullCustomer);
      setViewMode("detail");
    } catch (error) {
      showApiError(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleBack = () => {
    setViewMode("table");
    setSelectedCustomer(null);
  };

  const handleDisableCustomer = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await fireManagedSwal({
      title: "Disable Customer?",
      text: "Customer will be marked as inactive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Disable",
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Disabling Customer...");
      await updateCustomerStatus(customerId, "inactive");
      closeSwal();
      showSuccess("Customer disabled successfully.");
      triggerRefresh(REFRESH_KEYS.CUSTOMER_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns — memoized
  const columns: Column<CustomerSummary>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Customer ID",
        align: "left",
        render: (customer) => (
          <span className="font-medium whitespace-nowrap">{customer.id}</span>
        ),
        tooltip: (customer) => customer.id,
      },
      {
        key: "name",
        header: "Name",
        align: "left",
        render: (customer) => (
          <span className="font-medium block">{customer.name}</span>
        ),
        tooltip: (customer) => customer.name,
      },
      {
        key: "type",
        header: "Type",
        align: "left",
        render: (customer) => (
          <span className="text-muted whitespace-nowrap">
            {customer.type ?? "—"}
          </span>
        ),
      },
      {
        key: "tpin",
        header: "TPIN",
        align: "left",
        render: (customer) => (
          <span className="font-mono text-sm tabular-nums whitespace-nowrap">
            {customer.tpin ?? "—"}
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
            {customer.customerTaxCategory ?? "—"}
          </span>
        ),
      },
      {
        key: "currency",
        header: "Currency",
        align: "center",
        render: (customer) => (
          <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {customer.currency}
          </code>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (customer) => (
          <span
            className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              customer.status === "Active"
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
            <PermissionGate module={CUSTOMER_MODULE} action="read">
              <ActionButton
                type="view"
                onClick={() => handleRowClick(customer)}
                iconOnly
              />
            </PermissionGate>

            <PermissionGate module={CUSTOMER_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => handleEditCustomer(customer.id, e as any)}
                iconOnly
                title="Edit Customer"
              />
            </PermissionGate>

            <ActionMenu
              {...(can(CUSTOMER_MODULE, "delete")
                ? { onDelete: (e) => handleDelete(customer.id, e as any) }
                : {})}
              onDisable={
                customer.status !== "Inactive"
                  ? (e) => handleDisableCustomer(customer.id, e as any)
                  : undefined
              }
              customActions={[
                ...(can(PAYMENT_MODULE, "create")
                  ? [{ label: "Receive Payment", onClick: () => handleMakePayment(customer) }]
                  : []),
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [can, handleRowClick, handleEditCustomer, handleDelete, handleDisableCustomer, handleMakePayment],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      {viewMode === "table" ? (
        <Table
          columns={columns}
          data={customers}
          tableId="customer-management"
          rowKey={(r) => r.id}
         
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
          enableAdd={can(CUSTOMER_MODULE, "create")}
          addLabel="Add Customer"
          onAdd={handleAddCustomer}
          enableColumnSelector
          enableExport={can(CUSTOMER_MODULE, "export")}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          extraFilters={
            <FilterSelect
              value={taxCategory}
              onChange={(e) => {
                setTaxCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { label: "Non-Export", value: "Non-Export" },
                { label: "Export", value: "Export" },
              ]}
            />
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