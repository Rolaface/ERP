import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

interface Payment {
  paymentNumber: string;
  customerName: string;
  invoiceNumber: string;
  paymentDate: Date;
  amount: number;
  method: string;
  status: string;
}

interface Props {
  onAddPayment?: () => void;
}

const PaymentsTable: React.FC<Props> = ({ onAddPayment }) => {
  const [payments, setPayments] = useState<Payment[]>([]);

  const columns: Column<Payment>[] = [
    {
      key: "paymentNumber",
      header: "Payment No",
      render: (p) => (
        <span className="font-semibold text-main">{p.paymentNumber}</span>
      ),
    },

    {
      key: "customerName",
      header: "Customer",
      render: (p) => (
        <span className="text-sm text-main">{p.customerName}</span>
      ),
    },

    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (p) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover">
          {p.invoiceNumber}
        </code>
      ),
    },

    {
      key: "paymentDate",
      header: "Date",
      render: (p) => (
        <span className="text-xs text-muted">
          {new Date(p.paymentDate).toLocaleDateString()}
        </span>
      ),
    },

    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover">
          {p.amount.toLocaleString()}
        </code>
      ),
    },

    {
      key: "method",
      header: "Method",
      render: (p) => (
        <span className="text-xs text-main">{p.method}</span>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (p) => (
        <ActionGroup>
          <ActionButton type="view" iconOnly />
          <ActionMenu />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={payments}
        showToolbar
        enableAdd
        addLabel="Record Payment"
        onAdd={onAddPayment}
        enableExport
      />
    </div>
  );
};

export default PaymentsTable;
