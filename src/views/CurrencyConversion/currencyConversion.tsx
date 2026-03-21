import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";
import {FaExchangeAlt } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import CurrencyConversionModal from "../../components/currencyconversion/CurrencyConversionModal";

const CurrencyConversion: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  /* ───────── COLUMNS ───────── */
  const columns = [
    {
      key: "name",
      header: "Date",
    },
    {
      key: "type",
      header: "From Currency",
    },
    {
      key: "defaultAccount",
      header: "To Currency",
      render: (row: any) => row.defaultAccount || "—",
    },
    {
      key: "enabled",
      header: "Buy Rate",
      render: (row: any) =>
        row.enabled ? (
          <span className="text-green-600 font-semibold">Enabled</span>
        ) : (
          <span className="text-red-500 font-semibold">Disabled</span>
        ),
    },
    {
      key: "actions",
      header: "Sell Rate",
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
          <FaExchangeAlt className="text-primary" />
          Currency Exchange List
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
        addLabel="Add Currency Exchange"
        onAdd={() => setShowModal(true)}
      />

      {/* EMPTY */}
      {data.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No Exchnage Rate List Found
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <CurrencyConversionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CurrencyConversion;