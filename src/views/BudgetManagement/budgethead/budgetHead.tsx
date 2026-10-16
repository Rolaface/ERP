import React, { useMemo, useState } from "react";
import { Power, PowerOff } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showApiError, showSuccess } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import BudgetHeadModal, { type BudgetHeadDetail, type BudgetHeadStatus, type HeadType } from "./budgetHeadModal";
import { HEADS, GROUP_LABEL, StatusPill, formatDate, today, useLocalTable, fmt } from "../sharedbudget";

interface BudgetHeadSummary extends BudgetHeadDetail {
  usageCount: number;
  updatedAt: string;
}

const BUDGET_MODULE = "Budget Head";

const SEED: BudgetHeadSummary[] = HEADS.map((h, i) => ({
  id: h.id,
  headCode: h.code,
  headName: h.name,
  parentHead: GROUP_LABEL[h.group],
  headType: h.type as HeadType,
  glCode: h.glCode,
  controlLevel: h.control,
  defaultCap: h.cap ? String(h.cap) : "",
  overspend: h.overspend,
  costCentre: h.costCentre,
  programme: h.programme,
  projectCode: "",
  yearEnd: h.type === "Capital" ? "Carry forward" : "Lapse",
  transferable: h.control !== "Fixed",
  attachmentRequired: h.type === "Capital",
  instructions: "",
  status: i === 9 ? "Inactive" : "Active",
  usageCount: i % 4 === 0 ? 0 : 3,
  updatedAt: `2026-10-${String(i + 1).padStart(2, "0")}`,
}));

const BudgetHeadTable: React.FC = () => {
  const { can } = usePermission();
  const [heads, setHeads] = useState<BudgetHeadSummary[]>(SEED);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHead, setModalHead] = useState<BudgetHeadDetail | null>(null);

  const { processed, tableProps } = useLocalTable(heads, {
    searchKeys: ["headName", "headCode", "parentHead", "glCode", "headType", "costCentre", "programme"],
    sortBy: "updatedAt",
    filters: [
      { key: "status", label: "Status", options: [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }] },
      { key: "headType", label: "Type", options: ["Operating", "Capital", "Revenue", "Headcount"].map((v) => ({ label: v, value: v })) },
    ],
  });

  const handleSubmit = (data: BudgetHeadDetail) => {
    if (data.id) {
      setHeads((prev) => prev.map((h) => (h.id === data.id ? { ...h, ...data, updatedAt: today() } : h)));
      showSuccess("Budget head updated");
    } else {
      setHeads((prev) => [{ ...data, id: `BH-${Date.now()}`, usageCount: 0, updatedAt: today() }, ...prev]);
      showSuccess("Budget head created");
    }
  };

  const openEdit = (h: BudgetHeadSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalHead(h);
    setModalOpen(true);
  };

  const handleToggleStatus = async (h: BudgetHeadSummary) => {
    const next: BudgetHeadStatus = h.status === "Active" ? "Inactive" : "Active";
    if (next === "Inactive") {
      const result = await fireManagedSwal({
        icon: "warning",
        title: "Deactivate budget head?",
        text: `${h.headName} won't be available for new budget plans. Existing plans keep it.`,
        showCancelButton: true,
        confirmButtonColor: "#ef0000",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, deactivate",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;
    }
    setHeads((prev) => prev.map((x) => (x.id === h.id ? { ...x, status: next, updatedAt: today() } : x)));
    showSuccess(`Budget head ${next === "Active" ? "activated" : "deactivated"}`);
  };

  const handleDelete = async (h: BudgetHeadSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete budget head ${h.headName}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setHeads((prev) => prev.filter((x) => x.id !== h.id));
    showSuccess("Budget head deleted");
  };

  const handleExport = () => {
    if (!processed.length) {
      showApiError("No budget heads to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(
      processed.map((h) => ({
        "Head Code": h.headCode,
        "Budget Head": h.headName,
        "Parent Head": h.parentHead,
        Type: h.headType,
        "GL Code": h.glCode,
        Control: h.controlLevel,
        "Default Cap": h.controlLevel === "Capped" ? h.defaultCap : "",
        "On Overspend": h.overspend,
        "Default Cost Centre": h.costCentre,
        Programme: h.programme,
        "Year End": h.yearEnd,
        Transferable: h.transferable ? "Yes" : "No",
        Status: h.status,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Budget Heads");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Budget_Heads.xlsx",
    );
    showSuccess("Budget heads exported successfully");
  };

  const columns: Column<BudgetHeadSummary>[] = useMemo(
    () => [
      {
        key: "headName",
        header: "Budget Head",
        align: "left",
        sortable: true,
        render: (h) => (
          <div className="py-1.5">
            <span className="block font-medium">{h.headName}</span>
            <span className="block text-xs text-muted">
              {h.headCode} · Under {h.parentHead || "—"}
            </span>
          </div>
        ),
      },
      { key: "headType", header: "Type", align: "left", sortable: true, render: (h) => <div className="py-1.5">{h.headType}</div> },
      { key: "glCode", header: "GL Code", align: "left", sortable: true, render: (h) => <div className="whitespace-nowrap py-1.5">{h.glCode}</div> },
      {
        key: "controlLevel",
        header: "Planning control",
        align: "left",
        sortable: true,
        render: (h) => (
          <div className="py-1.5">
            <StatusPill value={h.controlLevel} />
            {h.controlLevel === "Capped" && h.defaultCap && <span className="ml-1.5 text-xs text-muted">up to {fmt(Number(h.defaultCap))}</span>}
          </div>
        ),
      },
      { key: "overspend", header: "On overspend", align: "left", sortable: true, render: (h) => <div className="py-1.5"><StatusPill value={h.overspend} /></div> },
      { key: "status", header: "Status", align: "center", render: (h) => <div className="flex justify-center py-1.5"><StatusPill value={h.status} /></div> },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (h) => {
          const canDelete = can(BUDGET_MODULE, "delete") && h.usageCount === 0;
          const customActions = can(BUDGET_MODULE, "write")
            ? [
                {
                  label: h.status === "Active" ? "Deactivate" : "Activate",
                  icon: h.status === "Active" ? <PowerOff size={14} /> : <Power size={14} />,
                  danger: h.status === "Active",
                  onClick: () => handleToggleStatus(h),
                },
              ]
            : [];
          return (
            <div className="flex items-center justify-center gap-2">
              <PermissionGate module={BUDGET_MODULE} action="write">
                <ActionButton type="edit" onClick={(e) => openEdit(h, e)} iconOnly title="Edit budget head" />
              </PermissionGate>
              <div className={customActions.length === 0 && !canDelete ? "pointer-events-none opacity-40" : ""}>
                <ActionMenu {...(canDelete ? { onDelete: (e: React.MouseEvent) => handleDelete(h, e) } : {})} customActions={customActions} />
              </div>
            </div>
          );
        },
      },
    ],
    [can],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        rowKey={(row) => row.id}
        tableId="budget-heads"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(BUDGET_MODULE, "create")}
        addLabel="Add Budget Head"
        onAdd={() => {
          setModalHead(null);
          setModalOpen(true);
        }}
        enableColumnSelector
        enableExport={can(BUDGET_MODULE, "export")}
        onExport={handleExport}
        onRowDoubleClick={(h) => can(BUDGET_MODULE, "write") && openEdit(h)}
        {...tableProps}
      />
      <BudgetHeadModal
        open={modalOpen}
        initial={modalHead}
        onClose={() => {
          setModalOpen(false);
          setModalHead(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BudgetHeadTable;