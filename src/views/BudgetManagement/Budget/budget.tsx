import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showApiError, showSuccess } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import { PLANS, StatusPill, formatDate, inr, useLocalTable, type PlanRef } from "../sharedbudget";

interface BudgetProps {
  onAddBudget?: () => void;
  onEditBudget?: (budgetId: string) => void;
  onViewBudget?: (budgetId: string) => void;
}

const BUDGET_MODULE = "Budget";
const STATUSES = ["Draft", "Open for input", "In approval", "Active", "Closed"];

const Budget: React.FC<BudgetProps> = ({ onAddBudget, onEditBudget, onViewBudget }) => {
  const { can } = usePermission();
  const [plans, setPlans] = useState<PlanRef[]>(PLANS);

  const { processed, tableProps } = useLocalTable(plans, {
    searchKeys: ["code", "name", "financialYear", "type"],
    sortBy: "code",
    filters: [
      { key: "status", label: "Status", options: STATUSES.map((v) => ({ label: v, value: v })) },
      { key: "financialYear", label: "Financial year", options: Array.from(new Set(PLANS.map((p) => p.financialYear))).map((v) => ({ label: v, value: v })) },
      { key: "type", label: "Type", options: ["Operating", "Capital"].map((v) => ({ label: v, value: v })) },
    ],
  });

  const handleDelete = async (p: PlanRef, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete budget plan ${p.code}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setPlans((prev) => prev.filter((x) => x.code !== p.code));
    showSuccess("Budget plan deleted");
  };

  const handleExport = () => {
    if (!processed.length) {
      showApiError("No budget plans to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(
      processed.map((p) => ({
        "Plan Code": p.code,
        Name: p.name,
        "Financial Year": p.financialYear,
        Type: p.type,
        Version: p.version,
        Participants: p.participants,
        Submitted: p.submitted,
        "Total Amount": p.envelope,
        Allocated: p.allocated,
        "Input Deadline": p.deadline,
        Workflow: p.workflow,
        Status: p.status,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Budget Plans");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Budget_Plans.xlsx",
    );
    showSuccess("Budget plans exported successfully");
  };

  const columns: Column<PlanRef>[] = useMemo(
    () => [
      { key: "code", header: "Plan Code", align: "left", sortable: true, render: (p) => <div className="whitespace-nowrap py-1.5">{p.code}</div> },
      {
        key: "name",
        header: "Plan",
        align: "left",
        sortable: true,
        render: (p) => (
          <div className="py-1.5">
            <span className="block font-medium">{p.name}</span>
            <span className="block text-xs text-muted">{p.financialYear} · {p.type}</span>
          </div>
        ),
      },
      { key: "envelope", header: "Total amount", align: "right", sortable: true, render: (p) => <div className="whitespace-nowrap py-1.5">{p.envelope ? inr(p.envelope) : "—"}</div> },
      { key: "allocated", header: "Allocated", align: "right", sortable: true, render: (p) => <div className="whitespace-nowrap py-1.5">{p.allocated ? inr(p.allocated) : "—"}</div> },
      { key: "deadline", header: "Input deadline", align: "center", sortable: true, render: (p) => <div className="py-1.5">{formatDate(p.deadline)}</div> },
      { key: "status", header: "Status", align: "center", render: (p) => <div className="flex justify-center py-1.5"><StatusPill value={p.status} /></div> },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (p) => {
          const isDraft = p.status === "Draft";
          const canDelete = can(BUDGET_MODULE, "delete") && isDraft;
          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton type="view" iconOnly onClick={(e) => { e?.stopPropagation(); onViewBudget?.(p.code); }} />
              <PermissionGate module={BUDGET_MODULE} action="write">
                <ActionButton
                  type="edit"
                  iconOnly
                  disabled={!isDraft}
                  title={isDraft ? "Edit plan" : "Only draft plans can be edited"}
                  onClick={(e) => { e?.stopPropagation(); onEditBudget?.(p.code); }}
                />
              </PermissionGate>
              <div className={!canDelete ? "pointer-events-none opacity-40" : ""}>
                <ActionMenu showDownload={false} {...(canDelete ? { onDelete: (e: React.MouseEvent) => handleDelete(p, e) } : {})} customActions={[]} />
              </div>
            </div>
          );
        },
      },
    ],
    [can, onViewBudget, onEditBudget],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        rowKey={(row) => row.code}
        tableId="budget-plans"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(BUDGET_MODULE, "create")}
        addLabel="Add Budget Plan"
        onAdd={onAddBudget}
        enableColumnSelector
        enableExport={can(BUDGET_MODULE, "export")}
        onExport={handleExport}
        onRowDoubleClick={(p) => onViewBudget?.(p.code)}
        {...tableProps}
      />
    </div>
  );
};

export default Budget;