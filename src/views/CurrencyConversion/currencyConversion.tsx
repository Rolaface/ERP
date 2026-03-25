import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { FaExchangeAlt } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import CurrencyConversionModal from "../../components/currencyconversion/CurrencyConversionModal";
import {
  useCurrencyConversion,
  CurrencyConversionPayload,
} from "../../hooks/useCurrencyConversion";

const CurrencyConversion: React.FC = () => {
  const { data, loading, addConversion, deleteConversion } =
    useCurrencyConversion();

  const [showModal, setShowModal] = useState(false);

  /* ───────── COLUMNS ───────── */
  const columns: Column<CurrencyConversionPayload>[] = [
    {
      key: "date",
      header: "Date",
    },
    {
      key: "fromCurrency",
      header: "From Currency",
    },
    {
      key: "toCurrency",
      header: "To Currency",
    },
    {
      key: "buyRate",
      header: "Buy Rate",
    },
    {
      key: "sellRate",
      header: "Sell Rate",
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionMenu
            customActions={[
              {
                label: "Delete",
                onClick: () => deleteConversion(row.id),
              },
            ]}
          />
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
        loading={loading}
        rowKey={(r) => r.id}
        showToolbar
        enableAdd
        addLabel="Add Currency Exchange"
        onAdd={() => setShowModal(true)}
      />


      {/* MODAL */}
      {showModal && (
        <CurrencyConversionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={addConversion}
        />
      )}
    </div>
  );
};

export default CurrencyConversion;