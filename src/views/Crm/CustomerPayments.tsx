import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import type { Column } from "../../components/ui/Table/type";

import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";

import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../../utils/alert";

import Swal from "sweetalert2";

import { getAllPayments } from "../../api/CustomerPayment";

interface PaymentSummary {
  id: string;
  paymentDate: string;
  customerName: string;
  modeOfPayment: string;
  referenceNo: string;
  amount: number;
  status: string;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const handleAddPayment = () => {
    setOpenPaymentModal(true);
  };
  /**
   * Fetch Payments
   */

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAllPayments(
        "Customer",
        page,
        pageSize,
        searchTerm,
      );

      const paymentsList = response?.data?.payments ?? [];

      const mapped: PaymentSummary[] = paymentsList.map((p: any) => ({
        id: p.paymentId ?? "",
        paymentDate: p.paymentDate ?? "",
        customerName: p.partyName ?? "",
        modeOfPayment: p.paymentMode ?? "",
        referenceNo: p.referenceNumber ?? "-",
        amount: Number(p.amount ?? 0),
        status: p.status ?? "Draft",
      }));

      setPayments(mapped);

      setTotalPages(response?.data?.pagination?.totalPages ?? 1);
      setTotalItems(response?.data?.pagination?.total ?? mapped.length);
    } catch (error) {
      console.error("Error fetching payments:", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /**
   * Delete Payment
   */
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Payment?",
      text: `Payment ${id} will be removed`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Payment...");

      /**
       * TODO: connect delete API
       */

      closeSwal();

      setPayments((prev) => prev.filter((p) => p.id !== id));

      showSuccess("Payment deleted");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  /**
   * Table Columns
   */
  const columns: Column<PaymentSummary>[] = [
    {
      key: "id",
      header: "Payment No.",
      align: "left",
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      align: "left",
    },
    {
      key: "customerName",
      header: "Customer Name",
      align: "left",
    },
    {
      key: "modeOfPayment",
      header: "Mode of Payment",
      align: "left",
      render: (p: PaymentSummary) => <StatusBadge status={p.modeOfPayment} />,
    },
    {
      key: "referenceNo",
      header: "Reference No.",
      align: "left",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p: PaymentSummary) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ₹ {p.amount.toLocaleString()}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p: PaymentSummary) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={payments}
        loading={loading || initialLoad}
        showToolbar
        enableColumnSelector
        searchValue={searchTerm}
        enableAdd
        addLabel="Recieve Payment"
        onAdd={handleAddPayment}
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
      />
      <PaymentEntryModal
        isOpen={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
      />
    </div>
  );
};

export default Payments;
