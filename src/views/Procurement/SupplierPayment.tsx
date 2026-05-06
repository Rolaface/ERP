import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import type { Column } from "../../components/ui/Table/type";

import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";

import { getAllPayments } from "../../api/CustomerPayment";

interface PaymentSummary {
  id: string;
  paymentDate: string;
  supplierName: string;
  modeOfPayment: string;
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

    const response = await getAllPayments(
      "Supplier",
      page,
      pageSize,
      searchTerm
    );

    const paymentsList = response?.data?.payments || [];

    const mapped: PaymentSummary[] = paymentsList.map((p: any) => ({
      id: p.paymentId,
      paymentDate: p.paymentDate,
      supplierName: p.partyName,
      modeOfPayment: p.paymentMode,
      referenceNo: p.referenceNumber || "-",
      amount: Number(p.amount),
      status: p.status,
    }));

    setPayments(mapped);

    setTotalPages(response?.data?.pagination?.totalPages || 1);
    setTotalItems(response?.data?.pagination?.total || mapped.length);

  } catch (error) {
    console.error("Error fetching payments:", error);
    showApiError(error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize, searchTerm]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
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

      // await deletePaymentById(id);

      closeSwal();

      setPayments((prev) => prev.filter((p) => p.id !== id));

      showSuccess("Payment deleted");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
  const formatDate = (date: string | Date) => {
  if (!date) return "";

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }

  // Date object — use local methods
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

  const columns: Column<PaymentSummary>[] = [
    {
      key: "id",
      header: "Id",
      align: "left",
      render: (p) => <div className="py-1.5">{p.id || "—"}</div>
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      align: "left",
      render: (p) => <div className="py-1.5">{p.paymentDate ? formatDate(p.paymentDate) : "—"}</div>
    },
    {
      key: "supplierName",
      header: "Supplier Name",
      align: "left",
      render: (p) => <div className="py-1.5">{p.supplierName || "—"}</div>
    },
    {
      key: "modeOfPayment",
      header: "Mode of Payment",
      align: "left",
      render: (p) => <div className="py-1.5">{p.modeOfPayment || "—"}</div>
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p: PaymentSummary) => (
        <div className="py-1.5">
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
           {p.amount}
        </code>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p: PaymentSummary) => (
        <div className="py-1.5">
          <StatusBadge status={p.status} />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={payments}
        tableId="supplier-payments"
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
