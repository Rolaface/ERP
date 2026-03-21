import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import PaymentEntryModal from "./PaymentEntryModal";
import { FaMoneyBillWave } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

const PaymentEntry: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  /* ───────── COLUMNS ───────── */
  const columns = [
    {
      key: "name",
      header: "Mode",
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "defaultAccount",
      header: "Default Account",
      render: (row: any) => row.defaultAccount || "—",
    },
    {
      key: "enabled",
      header: "Status",
      render: (row: any) =>
        row.enabled ? (
          <span className="text-green-600 font-semibold">Enabled</span>
        ) : (
          <span className="text-red-500 font-semibold">Disabled</span>
        ),
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
        rowKey={(r) => `${r.id}-${r.type}`}
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