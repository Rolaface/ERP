import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import CustomerGroupModal from "../../components/customerGroup/CustomerGroupModal";
import { FaUsersCog } from "react-icons/fa";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

const CustomerGroup: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Customer Group Name",
    },
    {
      key: "isGroup",
      header: "Is Group",
      render: (row: any) =>
        row.isGroup ? (
          <span className="text-primary font-semibold">Yes</span>
        ) : (
          <span className="text-muted">No</span>
        ),
    },
    {
      key: "defaultPriceList",
      header: "Default Price List",
      render: (row: any) => row.defaultPriceList || "—",
    },
    {
      key: "defaultPaymentTerms",
      header: "Payment Terms",
      render: (row: any) => row.defaultPaymentTerms || "—",
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-main flex items-center gap-2">
          <FaUsersCog className="text-primary" />
          Customer Group
        </h1>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={false}
        rowKey={(r) => `${r.id || Math.random()}`}
        showToolbar
        enableAdd
        addLabel="Add Customer Group"
        onAdd={() => setShowModal(true)}
      />

      {showModal && (
        <CustomerGroupModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CustomerGroup;