import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import PaymentEntryModal from "./PaymentEntryModal";
import { FaMoneyBillWave } from "react-icons/fa";
import type { Column } from "../../components/ui/Table/type";

import { getAllPayments } from "../../api/CustomerPayment";
import { showApiError } from "../../utils/alert";
import StatusBadge from "../../components/ui/Table/StatusBadge";


// API Response Type

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

const PaymentEntry: React.FC = () => {
  const [data, setData] = useState<PaymentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);


  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAllPayments(
        undefined,
        page,
        pageSize,
        searchTerm
      );

      const payments: PaymentAPI[] =
        response?.data?.payments || [];

      const mapped: PaymentRow[] = payments.map((p) => ({
        id: p.paymentId,
        status: p.status || "-",
        partyType: p.partyType || "—",
        partyName: p.partyName || "—",
        mode: p.paymentMode || "—",
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate
          ? new Date(p.paymentDate).toLocaleDateString("en-IN")
          : "-",
      }));

      setData(mapped);
      setTotalPages(response?.data?.pagination?.totalPages ?? 1);
      setTotalItems(response?.data?.pagination?.total ?? mapped.length);
    } catch (error: any) {
      console.error("Payment fetch error:", error);
      showApiError(
        error?.response?.data?.message || "Failed to fetch payments"
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

  /**
   * TABLE COLUMNS
   */
  const columns: Column<PaymentRow>[] = [
    {
      key: "id",
      header: "P.Id",
      render: (row) => row.id || "-",
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (row) => row.paymentDate || "-"
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
      render: (row) =>
        ` ${row.amount?.toLocaleString("en-IN") || 0}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row: PaymentRow) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaMoneyBillWave className="text-primary" />
          Payment Entry
        </h1>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(r) => r.id}
        searchValue={searchTerm}
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
        enableAdd
        addLabel="Add Payment Entry"
        onAdd={() => setShowModal(true)}
      />

      {/* MODAL */}
      {showModal && (
        <PaymentEntryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentEntry;