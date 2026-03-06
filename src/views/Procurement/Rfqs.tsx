import React, { useState, useMemo } from "react";
import RfqTabsModal from "../../components/procurement/rfq/RfqModal";
import toast from "react-hot-toast";
import { useEffect } from "react";
import type { Column } from "../../components/ui/Table/type";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";

interface RFQ {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
  dueDate: string;
}

interface RFQsTableProps {
  onAdd?: () => void;
}

const RFQsTable: React.FC<RFQsTableProps> = ({ onAdd }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  // ================= FETCH RFQs =================
  const fetchRFQs = async () => {
    try {
      setLoading(true);

      // const res = await getRFQs();
      // setRfqs(res.data);

      setRfqs([]); // temporary empty state
    } catch (err) {
      console.error("Failed to load RFQs", err);
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  // ================= FILTER =================
  const filteredRFQs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rfqs.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.supplier.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term),
    );
  }, [rfqs, searchTerm]);

  // ================= MODAL HANDLERS =================
  const handleAddClick = () => {
    setModalOpen(true);
    onAdd?.();
  };

  const handleEdit = (_rfq: RFQ, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalOpen(true);
  };

  const handleDelete = (rfq: RFQ, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete RFQ "${rfq.id}"?`)) {
      toast.success("Delete API ready — connect backend later");
    }
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleView = (_rfq: RFQ) => {
    setModalOpen(true);
  };

  // ================= TABLE COLUMNS =================
  const columns: Column<RFQ>[] = [
    { key: "id", header: "RFQ ID", align: "left" },
    { key: "supplier", header: "Supplier", align: "left" },
    { key: "date", header: "Date", align: "left" },

    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ${r.amount?.toLocaleString()}
        </code>
      ),
    },

    {
      key: "status",
      header: "Status",
      align: "left",
      render: (r) => <StatusBadge status={r.status} />,
    },

    { key: "dueDate", header: "Due Date", align: "left" },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (r) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => handleView(r)} iconOnly />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(r, e as any)}
            iconOnly
          />
          <ActionButton
            type="delete"
            onClick={(e) => handleDelete(r, e as any)}
            iconOnly
            variant="danger"
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Table
        columns={columns}
        data={filteredRFQs}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add RFQ"
        onAdd={handleAddClick}
        enableColumnSelector
      />

      {/* Modal */}
      <RfqTabsModal isOpen={modalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default RFQsTable;
