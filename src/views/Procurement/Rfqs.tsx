import React, { useState, useMemo } from "react";
import { openRfqModal } from "../../store/modalStore";
import toast from "react-hot-toast";
import { useEffect } from "react";
import type { Column } from "../../components/ui/Table/type";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { getRFQ, updateStatus } from "../../api/procurement/rfqApi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { frappeDelete } from "../../api/Delete/frappeDeleteApi";
import { fireManagedSwal } from "../../utils/swalManager";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import {
  ACTION_ICONS,
  getStatusActionIcon,
} from "../../components/UI_Utils/statusActionIcons";
import { Ban, CheckCircle } from "lucide-react";

interface RFQ {
  name: string;
  transaction_date: string;
  schedule_date: string;
  status: string;
}

interface RFQsTableProps {
  onAdd?: () => void;
}

const RFQ_MODULE = "Request For Quotation";

const RFQsTable: React.FC<RFQsTableProps> = ({ onAdd }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { can } = usePermission();

 const fetchRFQs = async () => {
  try {
    setLoading(true);
    const start = (page - 1) * pageSize;
    const res = await getRFQ(start, pageSize, searchTerm);
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
  }, [page, pageSize,searchTerm]);
  
  useEffect(() => {
  setPage(1);
}, [searchTerm]);

  // ================= FILTER =================
  const filteredRFQs = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return rfqs.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
  }, [rfqs, searchTerm]);

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

  const handleView = (rfq: RFQ, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openRfqModal(rfq.name, true, { isViewMode: true });
  };

  const handleDelete = async (rfq: RFQ, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete RFQ "${rfq.name}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting RFQ...");
      await frappeDelete({ name: rfq.name, doctype: "Request for Quotation" });
      closeSwal();
      showSuccess("RFQ deleted successfully");
      await fetchRFQs();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
const handleSubmit = async (rfq: RFQ) => {
  const confirm = await fireManagedSwal({
    icon: "warning",
    title: "Approve RFQ?",
    text: `This will approve "${rfq.name}". This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, approve",
  });

  if (!confirm.isConfirmed) return;  // ✅ yahan ruk jayega agar cancel kiya

  try {
    showLoading("Submitting RFQ...");
    await updateStatus(rfq.name, "submit");
    closeSwal();
    showSuccess("RFQ submitted successfully");
    await fetchRFQs();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};

const handleCancel = async (rfq: RFQ) => {
  const confirm = await fireManagedSwal({
    icon: "warning",
    title: "Cancel RFQ?",
    text: `This will cancel "${rfq.name}". This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, cancel",
  });

  if (!confirm.isConfirmed) return;

  try {
    showLoading("Cancelling RFQ...");
    await updateStatus(rfq.name, "cancel");
    closeSwal();
    showSuccess("RFQ cancelled successfully");
    await fetchRFQs();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
          <PermissionGate module={RFQ_MODULE} action="read">
            <ActionButton
              type="view"
              onClick={(e) => handleView(o, e)}
              iconOnly
            />
          </PermissionGate>

          <PermissionGate module={RFQ_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(o, e)}
              iconOnly
              disabled={o.status !== "Draft"}
              title={o.status !== "Draft" ? "Only Draft RFQs can be edited" : "Edit RFQ"}
            />
          </PermissionGate>

          <ActionMenu
  customActions={[
    ...(can(RFQ_MODULE, "submit") && o.status === "Draft"
      ? [{
          label: "Approve",
          icon: <CheckCircle className="w-4 h-4" />,
          onClick: () => { handleSubmit(o); },      
          }]
      : []),
    ...(can(RFQ_MODULE, "cancel") && o.status === "Submitted"
      ? [{
          label: "Cancel",
          icon: <Ban className="w-4 h-4" />,
          onClick: () => handleCancel(o),
          danger: true,
        }]
      : []),
  ]}
  {...(can(RFQ_MODULE, "delete")
    ? {
        onDelete: o.status !== "Submitted"
          ? (e) => handleDelete(o, e)
          : undefined,
        deleteLabel: o.status === "Submitted" ? "Delete" : undefined,
      }
    : {})}
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
        enableAdd={can(RFQ_MODULE, "create")}
        addLabel="Add RFQ"
        enableColumnSelector
        onAdd={handleAddClick}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
         pageSizeOptions={[20, 50, 100,200]}
        onRowDoubleClick={(o) => handleView(o)}
      />
    </div>
  );
};

export default RFQsTable;
