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
import { getPaymentEntryById } from "../../api/BankAccountApi";
import { ActionMenu } from "../../components/ui/Table/ActionButton";
import SendEmailModal from "../../components/common/SendEmailModal";
import PaymentEntryDetailModal from "./PaymetnEntryDetailModal";
import ActionButton from "../../components/ui/Table/ActionButton";
import type { PaymentEntryDetail } from "./PaymetnEntryDetailModal";

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
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PaymentEntryDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  // email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailPayment, setEmailPayment] = useState<PaymentRow | null>(null);
  const [emailContactEmail, setEmailContactEmail] = useState<string | null>(null);
  const [emailAttachments, setEmailAttachments] = useState<{ name: string; file_name: string }[]>([]);

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

  const columns: Column<PaymentRow>[] = [
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
      render: (row) => ` ${row.amount?.toLocaleString("en-IN") || 0}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row: PaymentRow) => <StatusBadge status={row.status} />,
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
                label: "Send Email",
                onClick: async () => {
                  setEmailPayment(row);
                  setEmailContactEmail(null);
                  setEmailAttachments([]);
                  setEmailModalOpen(true);

                  try {
                    const res = await getPaymentEntryById(row.id);

                    if (res?.message?.status_code === 200) {
                      setEmailContactEmail(
                        res.message.data?.contact_email ?? null
                      );
                      setEmailAttachments(
                        res.message.data?.attachments ?? []
                      );
                    }
                  } catch {
                    // non-critical: modal opens with empty To/attachments
                  }
                },
              },
            ]}
          />
        </div>
      ),
    }
  ];

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
      <SendEmailModal
        open={emailModalOpen}
        docType="Payment Entry"
        invoiceNumber={emailPayment?.id}
        contactEmail={emailContactEmail}
        invoiceAttachments={emailAttachments}
        onClose={() => {
          setEmailModalOpen(false);
          setEmailPayment(null);
          setEmailContactEmail(null);
          setEmailAttachments([]);
        }}
      />

      <PaymentEntryDetailModal
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
        }}
      />
    </AppPage>
  );
};

export default PaymentEntry;