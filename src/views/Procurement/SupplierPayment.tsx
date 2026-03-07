import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";

import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../../utils/alert";

import Swal from "sweetalert2";

interface PaymentSummary {
  id: string;
  paymentDate: string;
  supplierName: string;
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

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await getAllPayments(page, pageSize);

      setPayments(response.data);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize]);

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

      await deletePaymentById(id);

      closeSwal();

      setPayments((prev) => prev.filter((p) => p.id !== id));

      showSuccess("Payment deleted");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

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
      key: "supplierName",
      header: "Supplier Name",
      align: "left",
    },
    {
      key: "modeOfPayment",
      header: "Mode of Payment",
      align: "left",
      render: (p: PaymentSummary) => (
        <StatusBadge status={p.modeOfPayment} />
      ),
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
          ₹ {p.amount}
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
        loading={loading}
        showToolbar
        enableColumnSelector
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
      />
    </div>
  );
};

export default Payments;