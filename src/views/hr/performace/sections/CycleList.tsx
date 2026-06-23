import { useState, useEffect, useCallback, useMemo } from "react";
import Table from "../../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../components/ui/Table/type";
import NewCycleModal from "../../../../components/Hr/performance/Newcyclemodal";
import type { NewCyclePayload } from "../../../../hooks/appraisal/useCycleModal";
import { Play } from "lucide-react";
import {
  getCycleList,
  getCycleById,
  createCycle,
  deleteCycle,
  startAppraisalCycle,
  type CycleItem,
} from "../../../../api/Appraisalapi/performanceCycleApi";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import { showApiError, showSuccess, showLoading, closeSwal, showConfirm } from "../../../../utils/alert";

import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import { fireManagedSwal } from "../../../../utils/swalManager";

// ─── Status badge styles ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Completed: "bg-[var(--row-hover)] text-[var(--muted)]",
  "Not Started": "bg-blue-50 text-blue-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

const CycleList = () => {
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Create modal ──
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── View modal ──
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCycle, setViewCycle] = useState<CycleItem | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [startingCycle, setStartingCycle] = useState<string | null>(null);

  // ── Fetch list ────────────────────────────────────────────────────────────

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getCycleList({ page, pageSize, search });
      setCycles(resp.data);
      setTotalPages(resp.pagination?.page_count ?? 1);
      setTotalItems(resp.pagination?.total ?? resp.data.length);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  useEffect(() => {
    const unsub = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.APPRAISAL_CYCLE_LIST, fetchCycles);
    return unsub;
  }, [fetchCycles]);

  useEffect(() => { setPage(1); }, [search]);

  // ── Save (create) ──────────────────────────────────────────────────────────

  const handleSaveCycle = async (payload: NewCyclePayload) => {
    setSaving(true);
    try {
      await createCycle({
        cycle_name: payload.cycle_name,
        start_date: payload.start_date,
        end_date: payload.end_date,
        appraisees: payload.appraisees,
      });
      setCreateModalOpen(false);
      showSuccess("Appraisal cycle created");
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.APPRAISAL_CYCLE_LIST);
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartCycle = async (row: CycleItem) => {
    const confirmed = await showConfirm(
      `This will create appraisal records for all appraisees in "${row.cycle_name}". Continue?`,
      {
        title: "Start Appraisal Cycle?",
        confirmButtonText: "Yes, start",
        confirmButtonColor: "#22c55e",
      }
    );
    if (!confirmed) return;

    setStartingCycle(row.name);
    showLoading("Starting appraisal cycle...");

    try {
      const result = await startAppraisalCycle(row.name);
      closeSwal();

      if (result.status !== "success") {
        showApiError({ response: { data: { message: result.message } } });
        return;
      }

      if (result.serverMessages.length > 0) {
        await fireManagedSwal({
          icon: "warning",
          title: result.data?.message ?? "Cycle started with warnings",
          html: result.serverMessages
            .map((m) => `<div style="text-align:left;font-size:13px;margin-bottom:8px;">${m}</div>`)
            .join(""),
          confirmButtonText: "OK",
          confirmButtonColor: "#f59e0b",
        });
      } else {
        showSuccess(result.data?.message ?? "Appraisal cycle started successfully");
      }

      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.APPRAISAL_CYCLE_LIST);
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setStartingCycle(null);
    }
  };

  const handleDelete = async (name: string, cycleName: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete cycle "${cycleName}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteCycle(name);
      showSuccess("Cycle deleted");
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.APPRAISAL_CYCLE_LIST);
    } catch (err) {
      showApiError(err);
    }
  };

  // ── View — fetch full doc including appraisees ────────────────────────────

  const handleView = async (row: CycleItem) => {
    // Show modal immediately with list data, then hydrate with full doc
    setViewCycle(row);
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const full = await getCycleById(row.name);
      setViewCycle(full);
    } catch (err) {
      showApiError(err);
    } finally {
      setViewLoading(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<CycleItem>[] = useMemo(() => [
    {
      key: "cycle_name",
      header: "Cycle Name",
      sortable: true,
      truncate: true,
      render: (row) => (
        <span className="font-medium text-[var(--text)]">{row.cycle_name}</span>
      ),
    },
    {
      key: "start_date",
      header: "Start Date",
      align: "center",
      render: (row) => <DateDisplay date={row.start_date} />,
    },
    {
      key: "end_date",
      header: "End Date",
      align: "center",
      render: (row) => <DateDisplay date={row.end_date} />,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[row.status] ?? "bg-gray-100 text-gray-600"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <ActionButton
            type="view"
            iconOnly
            onClick={(e) => { e.stopPropagation(); handleView(row); }}
            title="View cycle"
          />
          <ActionMenu
            customActions={[
              {
                label: "Start Cycle",
                onClick: () => handleStartCycle(row),
                icon: <Play className="w-4 h-4" />,
                disabled: startingCycle === row.name || row.status === "In Progress",
              },
            ]}
            onDelete={() => handleDelete(row.name, row.cycle_name)}
          />
        </div>
      ),
    },
  ], []);

  return (
    <>
      <Table
        columns={columns}
        data={cycles}
        rowKey={(row) => row.name}
        tableId="appraisal-cycles"
        loading={loading}
        showToolbar
        searchValue={search}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        toolbarPlaceholder="Search cycles..."
        enableAdd
        addLabel="Add Cycle"
        onAdd={() => setCreateModalOpen(true)}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        onRowDoubleClick={(row) => handleView(row)}
      />

      {/* ── Create modal ── */}
      <NewCycleModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleSaveCycle}
        modalId="new-cycle-modal"
      />

      {viewCycle && (
        <NewCycleModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewCycle(null);
          }}
          onSave={() => { }}
          modalId={`view-cycle-${viewCycle.name.replace(/[^a-zA-Z0-9-_]/g, "-")}`}
          viewData={viewCycle}
          isViewMode
          viewLoading={viewLoading}
        />
      )}
    </>
  );
};

export default CycleList;