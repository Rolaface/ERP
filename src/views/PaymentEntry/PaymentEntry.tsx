import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
// import {
//   AppPage,
//   AppPageHeader,
//   AppPageBody,
// } from "../../components/ui/app-shell";
import { getAllPayments } from "../../api/CustomerPayment";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { showApiError } from "../../utils/alert";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openPaymentEntryModal,openSendEmailModal } from "../../store/modalStore";
import { usePermission } from "../../hooks/permission/usePermission";
import { getPaymentEntryById,cancelPaymentEntry } from "../../api/BankAccountApi";
import { ActionMenu } from "../../components/ui/Table/ActionButton";
import PaymentEntryDetailModal from "./PaymetnEntryDetailModal";
import ActionButton from "../../components/ui/Table/ActionButton";
import type { PaymentEntryDetail } from "./PaymetnEntryDetailModal";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";
import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";
import { showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
interface PaymentAPI {
  paymentId: string;
  paymentDate: string;
  paymentType: string;
  partyType: string;
  partyName: string;
  paymentMode: string;
  referenceNumber?: string;
  amount: number;
  status: string;
  currency?: string;
}

type PaymentRow = {
  id: string;
  paymentDate?: string;
  paymentType?: string;
  partyName?: string;
  mode?: string;
  amount?: number;
  status: string;
  partyType?: string;
  currency?: string;
};

const PAYMENT_ENTRY_MODULE = "Payment Entry";
const statusOptions = [
   { label: "Draft", value: "Draft" },
   { label: "Approved", value: "Submitted" },
   { label: "Cancelled", value: "Cancelled" },
 ];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const formatDate = (date: string | Date): string => {
  if (!date) return "—";
  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${MONTHS[month - 1]}-${year}`;
  }
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
};

interface PaymentEntryProps {
  defaultPartyType?: string;
}

const PaymentEntry: React.FC<PaymentEntryProps> = ({ defaultPartyType }) => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  // ── Data state — split loading so page changes don't flash full skeleton
  const [data, setData] = useState<PaymentRow[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PaymentEntryDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  

  // ── Search
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sorting
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
   const [filters, setFilters] = useState<{
  status?: string[];
   from_date?: string;
   to_date?: string;
 }>({});

  // ── Currency symbols + per-currency number formatting for the currencies
  // present in the currently loaded page of payments (same pattern as
  // InvoiceTable / CreditNotesTable).
  const currencyCodes = useMemo(() => extractCurrencyCodesFlat(data), [data]);
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  // ── Reset page on search change
  useEffect(() => { setPage(1); }, [searchTerm]);
  useEffect(() => { setPage(1); }, [filters]);

  // ── Fetch
  const fetchPayments = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const response = await getAllPayments(
        defaultPartyType as "Customer" | "Supplier" | undefined,
        page,
        pageSize,
        searchTerm,
          undefined, 
      filters.status && filters.status.length > 0
         ? filters.status.join(",")
         : undefined,
       filters.from_date,
       filters.to_date,
      );

      if (!mountedRef.current) return;

      const payments: PaymentAPI[] = response?.data?.payments || [];

      const mapped: PaymentRow[] = payments.map((p) => ({
        id: p.paymentId,
        status: p.status || "—",
        partyType: p.partyType || "—",
        partyName: p.partyName || "—",
        mode: p.paymentMode || "—",
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate || undefined,
        currency: p.currency,
      }));

      setData(mapped);
      setTotalPages(response?.data?.pagination?.totalPages ?? 1);
      setTotalItems(response?.data?.pagination?.total ?? mapped.length);
    } catch (error: any) {
      showApiError(error?.response?.data?.message || "Failed to fetch payments");
      setData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
 }, [page, pageSize, searchTerm, defaultPartyType, filters]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchPayments();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchPayments();
  }, [page, pageSize, searchTerm, sortBy, sortOrder, filters]);

  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);
    setSortOrder(order);
    setPage(1);
  };

  const columns: Column<PaymentRow>[] = useMemo(
    () => [
      {
        key: "id",
        header: "P Id",
        render: (row) => row.id || "-",
      },
      {
        key: "paymentDate",
        header: "Payment Date",
        render: (row) => row.paymentDate ? formatDate(row.paymentDate) : "-",
      },
      {
        key: "partyType",
        header: "party Type",
        render: (row) => row.partyType || "—",
      },
      {
        key: "partyName",
        header: "Party",
        render: (row) => row.partyName || "—",
      },
      {
        key: "mode",
        header: "Mode Of Payment",
        render: (row) => row.mode || "—",
      },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        render: (row) => (
          <span className="whitespace-nowrap">
            {formatAmount(row.currency, row.amount ?? 0, { withSymbol: true })}
          </span>
        ),
        tooltip: (row) =>
          `Amount: ${formatAmount(row.currency, row.amount ?? 0, { withSymbol: true })}`,
      },
      {
        key: "status",
        header: "Status",
              render: (row: PaymentRow) => (
         <StatusBadge
           status={row.status === "Submitted" ? "Approved" : row.status}
         />
       ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row: PaymentRow) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton
              type="view"
              iconOnly
              onClick={async () => {
                setDrawerOpen(true);
                setDrawerLoading(true);
                setDrawerData(null);

                try {
                  const res = await getPaymentEntryById(row.id);

                  if (res?.message?.status_code === 200) {
                    setDrawerData(res.message.data as PaymentEntryDetail);
                  }
                } finally {
                  setDrawerLoading(false);
                }
              }}
            />

            <ActionMenu
              customActions={[
                {
                  label: "Compose Email", icon: ACTION_ICONS.EMAIL,
                  onClick: async () => {
                    let contactEmail: string | null = null;
                    let invoiceAttachments: { name: string; file_name: string }[] = [];
                    try {
                      const res = await getPaymentEntryById(row.id);
                      if (res?.message?.status_code === 200) {
                        contactEmail = res.message.data?.contact_email ?? null;
                        invoiceAttachments = res.message.data?.attachments ?? [];
                      }
                    } catch {
                      // non-critical: modal opens with empty To/attachments
                    }
                    openSendEmailModal({
                      docType: "Payment Entry",
                      invoiceNumber: row.id,
                      contactEmail,
                      invoiceAttachments,
                    });
                  },
                },
  ...(row.status !== "Cancelled" ? [{
  label: "Cancel",
  icon: ACTION_ICONS.CANCEL,
  danger: true,
  onClick: async () => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Cancel Payment Entry?",
      text: `Are you sure you want to cancel payment entry "${row.id}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Cancelling payment entry...");
      await cancelPaymentEntry({ payment_entry_name: row.id });
      closeSwal();

      showSuccess("Payment entry cancelled successfully");
      await fetchPayments();
    } catch (error: any) {
      closeSwal();
      showApiError(error?.message || "Failed to cancel payment entry");
    }
  },
}] : []),
              ]}
            />
          </div>
        ),
      }
    ],
    [formatAmount],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <Table
          columns={columns}
          data={data}
          tableId="payment-entry"
          rowKey={(r) => r.id}
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
          enableColumnSelector
          enableAdd={can(PAYMENT_ENTRY_MODULE, "create")}
          addLabel="Add Payment Entry"
          onAdd={() =>
            openPaymentEntryModal(
              {
                ...(defaultPartyType && {
                  partyType: defaultPartyType,
                  paymentType: defaultPartyType === "Customer" ? "Receive" : "Pay",
                }),
              },
              false,
              { onSuccess: () => fetchPayments() }
            )
          }
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
           pageSizeOptions={[20, 50, 100,200]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onRowDoubleClick={async (row) => {
            setDrawerOpen(true);
            setDrawerLoading(true);
            setDrawerData(null);
            try {
              const res = await getPaymentEntryById(row.id);
              if (res?.message?.status_code === 200) {
                setDrawerData(res.message.data as PaymentEntryDetail);
              }
            } finally {
              setDrawerLoading(false);
            }
          }}
           multiSelectFilters={[
           {
             key: "status",
             label: "Status",
             options: statusOptions,
             values: filters.status ?? [],
             onChange: (vals) => {
               setFilters((prev) => ({
                 ...prev,
                 status: vals.length > 0 ? vals : undefined,
               }));
               setPage(1);
             },
           },
         ]}
         extraFilters={
           <DateRangeFilter
             from={filters.from_date}
             to={filters.to_date}
             onChange={(range) => {
               setFilters((prev) => ({ ...prev, ...range }));
               setPage(1);
             }}
           />
         }
        />
      </div>
      <PaymentEntryDetailModal
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
        }}
      />
    </>
  );
  //   </AppPage>
  // );

};

export default PaymentEntry;