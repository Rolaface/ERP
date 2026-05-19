import React, { useState, useEffect, useCallback } from "react";
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

// UI Table Type

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

const PaymentEntry: React.FC = () => {
  const [data, setData] = useState<PaymentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { can } = usePermission();
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailPayment, setEmailPayment] = useState<PaymentRow | null>(null);
  const [emailContactEmail, setEmailContactEmail] = useState<string | null>(null);
  const [emailAttachments, setEmailAttachments] = useState<{ name: string; file_name: string }[]>([]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAllPayments(
        undefined,
        page,
        pageSize,
        searchTerm,
      );

      const payments: PaymentAPI[] = response?.data?.payments || [];

      const mapped: PaymentRow[] = payments.map((p) => ({
        id: p.paymentId,
        status: p.status || "-",
        partyType: p.partyType || "—",
        partyName: p.partyName || "—",
        mode: p.paymentMode || "—",
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate || "-",
      }));

      setData(mapped);
      setTotalPages(response?.data?.pagination?.totalPages ?? 1);
      setTotalItems(response?.data?.pagination?.total ?? mapped.length);
    } catch (error: any) {
      console.error("Payment fetch error:", error);
      showApiError(
        error?.response?.data?.message || "Failed to fetch payments",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchPayments();
    }, 400);

    return () => clearTimeout(delay);
  }, [fetchPayments]);

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
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
                    setEmailContactEmail(res.message.data?.contact_email ?? null);
                    setEmailAttachments(res.message.data?.attachments ?? []);
                  }
                } catch {
                  // non-critical: modal opens with empty To/attachments
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AppPage>
      {/* HEADER */}
      <AppPageHeader
        title="Payment Entry"
        description="Manage customer and supplier payment transactions."
        icon={<Receipt />}
      />

      {/* TABLE */}
      <AppPageBody>
        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey={(r) => r.id}
          searchValue={searchTerm}
          enableColumnSelector
          tableId="payment-entry"
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
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
          showToolbar
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
    </AppPage>
  );
};

export default PaymentEntry;
