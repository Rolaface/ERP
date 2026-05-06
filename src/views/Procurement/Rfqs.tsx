import React, { useState, useMemo } from "react";
import { openRfqModal } from "../../store/modalStore";
import toast from "react-hot-toast";
import { useEffect } from "react";
import type { Column } from "../../components/ui/Table/type";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { getRFQ } from "../../api/procurement/rfqApi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

interface RFQ {
  name: string;
  transaction_date: string;
  schedule_date: string;
  status: string;
}

interface RFQsTableProps {
  onAdd?: () => void;
}

const RFQsTable: React.FC<RFQsTableProps> = ({ onAdd }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ================= FETCH RFQs =================
  const fetchRFQs = async () => {
    try {
      setLoading(true);

      const res = await getRFQ(page, pageSize);

      setRfqs(res.data);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

    } catch (error) {
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [page, pageSize]);

  // ================= FILTER =================
  const filteredRFQs = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return rfqs.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
  }, [rfqs, searchTerm]);

  // ================= MODAL HANDLERS =================
  const handleAddClick = () => {
    openRfqModal(null, false, {
      onSuccess: () => fetchRFQs(),
    });

    onAdd?.();
  };

  const handleEdit = (rfq: RFQ) => {

    openRfqModal(rfq.name, true, {
      onSuccess: fetchRFQs,
    });
  };

  const handleDelete = (rfq: RFQ, e: React.MouseEvent) => {
    e.stopPropagation();

    if (window.confirm(`Delete RFQ "${rfq.name}"?`)) {
      toast.success("Delete API ready");
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


  // ================= TABLE COLUMNS =================
  const columns: Column<RFQ>[] = [
    {
      key: "name",
      header: "RFQ ID",
      render: (r) => <div className="py-1.5">{r.name}</div>,
    },
    {
      key: "transaction_date",
      header: "Request Date",
      render: (r) => <div className="py-1.5">{r.transaction_date ? formatDate(r.transaction_date) : "—"}</div>,
    },
    {
      key: "schedule_date",
      header: "Quote Deadline",
      render: (r) => <div className="py-1.5">{r.schedule_date ? formatDate(r.schedule_date) : "—"}</div>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="py-1.5">
          <StatusBadge status={r.status} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e)}
            iconOnly
            disabled={o.status !== "Draft"}
            title={
              o.status !== "Draft"
                ? "Only Draft rfqs can be edited"
                : "Edit Request For Quotation"
            }
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={filteredRFQs}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add RFQ"
        enableColumnSelector
        onAdd={handleAddClick}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

export default RFQsTable;
