import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import { Receipt } from "lucide-react";
import type { Column } from "../../components/ui/Table/type";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import { getAllPayments } from "../../api/CustomerPayment";
import { showApiError } from "../../utils/alert";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openPaymentEntryModal } from "../../store/modalStore";
import { usePermission } from "../../hooks/permission/usePermission";

// ─── Types ────────────────────────────────────────────────────────────────────

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
};

const PAYMENT_ENTRY_MODULE = "Payment Entry";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC",
];

const formatDate = (date: string | Date): string => {
  if (!date) return "—";
  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${MONTHS[month - 1]}-${year}`;
  }
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
};

const formatAmount = (amount?: number): string => {
  if (amount === undefined || amount === null) return "₹ 0";
  return `₹ ${amount.toLocaleString("en-IN")}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentEntry: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  // ── Data state — split loading so page changes don't flash full skeleton
  const [data, setData] = useState<PaymentRow[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sorting
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Reset page on search change
  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Fetch
  const fetchPayments = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const response = await getAllPayments(
        undefined,
        page,
        pageSize,
        searchTerm,
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
  }, [page, pageSize, searchTerm]);

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
  }, [page, pageSize, searchTerm, sortBy, sortOrder]);

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

  // ── Columns — memoized to prevent unnecessary re-renders
  const columns: Column<PaymentRow>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        sortable: true,
        align: "left",
        render: (row) => (
          <span className="block font-medium">{row.id || "—"}</span>
        ),
        tooltip: (row) => row.id,
      },
      {
        key: "paymentDate",
        header: "Payment Date",
        sortable: true,
        align: "center",
        render: (row) => (
          <span className="block">
            {row.paymentDate ? formatDate(row.paymentDate) : "—"}
          </span>
        ),
      },
      {
        key: "partyType",
        header: "Party Type",   // Fix: was "party Type"
        align: "center",
        render: (row) => (
          <span className="block">{row.partyType || "—"}</span>
        ),
      },
      {
        key: "partyName",
        header: "Supplier Name",  // Fix: was just "Party"
        sortable: true,
        align: "left",
        render: (row) => (
          <span className="block font-medium">{row.partyName || "—"}</span>
        ),
        tooltip: (row) => row.partyName ?? "",
      },
      {
        key: "mode",
        header: "Mode Of Payment",
        align: "left",
        render: (row) => (
          <span className="block">{row.mode || "—"}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        align: "right",
        render: (row) => (
          <span className="block font-semibold whitespace-nowrap">
            {formatAmount(row.amount)}   {/* Fix: was ` ${amount}` with leading space, no ₹ */}
          </span>
        ),
        tooltip: (row) => formatAmount(row.amount),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AppPage>
      <AppPageHeader
        title="Payment Entry"
        description="Manage customer and supplier payment transactions."
        icon={<Receipt />}
      />

      <AppPageBody>
        <Table
          columns={columns}
          data={data}
          tableId="payment-entry"
          rowKey={(r) => r.id}
          // Fix: split loading states — no more full skeleton flash on page change
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
          onAdd={
            can(PAYMENT_ENTRY_MODULE, "create")
              ? () =>
                  openPaymentEntryModal(null, false, {
                    onSuccess: () => fetchPayments(),
                  })
              : undefined
          }
          // Fix: sorting now wired up
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </AppPageBody>
    </AppPage>
  );
};

export default PaymentEntry;