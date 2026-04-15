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

  const columns: Column<PaymentSummary>[] = [
    {
      key: "id",
      header: "Id",
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
      render: (p) => p.modeOfPayment || "—",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p: PaymentSummary) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
           {p.amount}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p: PaymentSummary) => (
        <StatusBadge status={p.status} />
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
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
