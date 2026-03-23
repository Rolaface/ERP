import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import PaymentEntryModal from "./PaymentEntryModal";
import { FaMoneyBillWave } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

type PaymentRow = {
  id: string;
  paymentType?: string;
  partyName?: string;
  mode?: string;
  amount?: number;
  allocatedAmount?: number;
};

const PaymentEntry: React.FC = () => {
  const [data, setData] = useState<PaymentRow[]>([]);
  const [showModal, setShowModal] = useState(false);

  
  const columns: Column<PaymentRow>[] = [
    {
      key: "paymentType",
      header: "Payment Type",
      render: (row) => row.paymentType || "—",
    },
    {
      key: "partyName",
      header: "Party",
      render: (row) => row.partyName || "—",
    },
    {
      key: "mode",
      header: "Mode",
      render: (row) => row.mode || "—",
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) =>
        row.amount ? `₹ ${row.amount.toLocaleString()}` : "—",
    },
    {
      key: "allocatedAmount",
      header: "Allocated",
      render: (row) =>
        row.allocatedAmount
          ? `₹ ${row.allocatedAmount.toLocaleString()}`
          : "₹ 0",
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: () => (
        <ActionGroup>
          <ActionMenu customActions={[]} />
        </ActionGroup>
      ),
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
        loading={false}
        rowKey={(r) => r.id}
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