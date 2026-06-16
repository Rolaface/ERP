import { useEffect, useState, useCallback } from "react";
import { FaTrash } from "react-icons/fa";
import type { Column } from "../../../../components/ui/Table/type";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";
import { showApiError, showLoading, closeSwal } from "../../../../utils/alert";
import { fireManagedSwal } from "../../../../utils/swalManager";
import { openFeedbackModal } from "../../../../store/modalStore";
import {
  deleteFeedback,
  getFeedbackById,
  getFeedbackList,
} from "../../../../api/Appraisalapi/feedbackApi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../components/ui/Table/ActionButton";

interface FeedbackRow {
  id: string;
  criteria?: string;
  creation?: string;
}

const PAGE_SIZE = 10;

export default function FeedbackSection() {
  const [data, setData] = useState<FeedbackRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await getFeedbackList({ page, pageSize: PAGE_SIZE, search });
      const mapped: FeedbackRow[] = (resp.data || []).map((r) => ({
        id: r.criteria,
        criteria: r.criteria,
        creation: r.creation || "-",
      }));
      setData(mapped);
      setTotalItems(resp.pagination?.total || mapped.length);
    } catch (err) {
      console.error("Failed to fetch feedback criteria", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const openDetail = async (id: string, mode: "view" | "edit") => {
    try {
      const detail = await getFeedbackById(id);
      openFeedbackModal(
        { id: detail.criteria, criteria: detail.criteria, creation: detail.creation },
        mode === "edit",
        {
          isViewMode: mode === "view",
          onSuccess: () => fetchFeedbacks(),
        },
      );
    } catch (err) {
      console.error("Failed to fetch feedback detail", err);
    }
  };

  const deleteRow = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete feedback criteria "${id}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting feedback criteria...");
      await deleteFeedback(id);
      closeSwal();
      setData((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      closeSwal();
      const raw =
        err?.response?.data?._server_messages ||
        err?.response?.data?.exception ||
        err?.message;
      let message = "Failed to delete feedback criteria";
      try {
        if (raw) {
          const parsed = JSON.parse(raw);
          const first = JSON.parse(parsed[0]);
          message = String(first.message)
            .replace(/<a [^>]*>(.*?)<\/a>/gi, "$1")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch {
        message = "Failed to delete feedback criteria";
      }
      showApiError(message);
    }
  };

  const columns: Column<FeedbackRow>[] = [
    {
      key: "creation",
      header: "Date Created",
      align: "center",
      render: (row) => (
        <span>
          {row.creation && row.creation !== "-"
            ? new Date(row.creation).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      key: "criteria",
      header: "Criteria",
      sortable: true,
      truncate: true,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            onClick={() => openDetail(row.id, "view")}
          />
          <ActionButton
            type="edit"
            iconOnly
            onClick={() => openDetail(row.id, "edit")}
          />
          <ActionMenu
  onDelete={() => deleteRow(row.id)}
/>
        </ActionGroup>
      ),
    },
  ];

  return (
     <div className="h-[calc(100vh-220px)]"> 
    <ModalTable<FeedbackRow>
      tableId="setup-feedback"
      columns={columns}
      data={data}
      rowKey={(r) => r.id}
      showToolbar
      toolbarPlaceholder="Search feedback criteria..."
      searchValue={search}
      onSearch={(q) => {
        setSearch(q);
        setPage(1);
      }}
      enableAdd
      addLabel="+ Add Criteria"
      onAdd={() =>
        openFeedbackModal(null, false, {
          onSuccess: () => fetchFeedbacks(),
        })
      }
      enableColumnSelector
      currentPage={page}
      totalPages={Math.max(1, Math.ceil(totalItems / PAGE_SIZE))}
      pageSize={PAGE_SIZE}
      totalItems={totalItems}
      onPageChange={setPage}
    />
    </div>
  );
}