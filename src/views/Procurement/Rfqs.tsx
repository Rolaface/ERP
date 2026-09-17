import React, { useState } from "react";
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
import { Ban, CheckCircle } from "lucide-react";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";

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

  // ── Sorting
  const [sortBy, setSortBy] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const SORT_FIELD_MAP: Record<string, string> = {
    name: "name",
    transaction_date: "transaction_date",
    schedule_date: "schedule_date",
  };

  const mapSortField = (field: string) => SORT_FIELD_MAP[field] ?? field;

  // ── Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    from_date?: string;
    to_date?: string;
  }>({});

  const statusOptions = [
    { label: "Draft", value: "Draft" },
    { label: "Approved", value: "Submitted" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const res = await getRFQ(
        start,
        pageSize,
        searchTerm,
        statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        mapSortField(sortBy),
        sortOrder,
        filters.from_date,
        filters.to_date,
      );
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
  }, [page, pageSize, searchTerm, statusFilter, filters, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, filters]);

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

  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);
    setSortOrder(order);
    setPage(1);
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

    if (!confirm.isConfirmed) return;

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

    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const columns: Column<RFQ>[] = [
    {
      key: "name",
      header: "RFQ ID",
      sortable: true,
      render: (r) => <div className="py-1.5">{r.name}</div>,
    },
    {
      key: "transaction_date",
      header: "Request Date",
      sortable: true,
      render: (r) => <div className="py-1.5">{r.transaction_date ? formatDate(r.transaction_date) : "—"}</div>,
    },
    {
      key: "schedule_date",
      header: "Quote Deadline",
      sortable: true,
      render: (r) => <div className="py-1.5">{r.schedule_date ? formatDate(r.schedule_date) : "—"}</div>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="py-1.5">
            <StatusBadge status={r.status === "Submitted" ? "Approved" : r.status} />
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
        data={rfqs}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd={can(RFQ_MODULE, "create")}
        addLabel="Add RFQ"
        enableColumnSelector
        onAdd={handleAddClick}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[20, 50, 100, 200]}
        onRowDoubleClick={(o) => handleView(o)}
        multiSelectFilters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            values: statusFilter,
            onChange: (vals) => {
              setStatusFilter(vals);
              setPage(1);
            },
          },
        ]}
        extraFilters={
          <DateRangeFilter
            from={filters.from_date}
            to={filters.to_date}
            onChange={(range) => {
              setFilters((prev) => ({ ...prev, ...range }));
              setPage(1);
            }}
          />
        }
      />
    </div>
  );
};

export default RFQsTable;