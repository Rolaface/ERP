import React, { useMemo, useState } from "react";
import { Save, Send, X } from "lucide-react";

import Table from "../../../components/ui/Table/Table";
import ActionButton from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showSuccess } from "../../../utils/alert";
import {
  useLocalTable,
  inr,
  fmt,
  formatDate,
  today,
  btnGhost,
  btnPrimary,
  sectionCard,
  inputCls,
  Field,
  ReadOnly,
  StatusPill,
  HEADS,
  PLANS,
  type ControlLevel,
} from "../sharedbudget";

const MODULE = "Request";
const BRANCH = { code: "BR-0101", name: "Meerut Main" };

type ReqStatus = "Draft" | "Submitted" | "Approved" | "Returned";

interface ReqRow {
  id: string;
  planCode: string;
  planName: string;
  financialYear: string;
  target: number;
  amounts: Record<string, string>;
  justification: string;
  status: ReqStatus;
  updatedAt: string;
}


interface Line {
  id: string;
  name: string;
  code: string;
  prevBudget: number;
  prevActual: number;
  control: ControlLevel;
  cap: number;
  fixed: number;
}

const PREV: Record<string, { budget: number; actual: number; fixed: number }> = {
  "H-101": { budget: 500000, actual: 450000, fixed: 480000 },
  "H-102": { budget: 100000, actual: 90000, fixed: 0 },
  "H-103": { budget: 90000, actual: 80000, fixed: 0 },
  "H-104": { budget: 40000, actual: 35000, fixed: 0 },
  "H-301": { budget: 50000, actual: 40000, fixed: 0 },
  "H-302": { budget: 80000, actual: 70000, fixed: 0 },
  "H-303": { budget: 70000, actual: 60000, fixed: 0 },
};

const LINES: Line[] = HEADS.filter((h) => PREV[h.id]).map((h) => ({
  id: h.id,
  name: h.name,
  code: h.code,
  prevBudget: PREV[h.id].budget,
  prevActual: PREV[h.id].actual,
  control: h.control,
  cap: h.cap,
  fixed: PREV[h.id].fixed,
}));

const OPEN_PLANS = PLANS.filter((p) => p.status === "Open for input");
const TARGETS: Record<string, number> = { "BUD-2728-001": 1000000, "BUD-2627-001": 960000 };

const SEED: ReqRow[] = [
  {
    id: "REQ-1001",
    planCode: "BUD-2728-001",
    planName: "Annual Operating Budget",
    financialYear: "FY 2027–28",
    target: 1000000,
    amounts: { "H-101": "480000", "H-102": "110000", "H-103": "85000", "H-104": "40000", "H-301": "", "H-302": "", "H-303": "" },
    justification: "Electricity rate revised from April.",
    status: "Draft",
    updatedAt: "2026-10-12",
  },
  {
    id: "REQ-0987",
    planCode: "BUD-2627-001",
    planName: "Annual Operating Budget",
    financialYear: "FY 2026–27",
    target: 960000,
    amounts: { "H-101": "480000", "H-102": "100000", "H-103": "90000", "H-104": "40000", "H-301": "50000", "H-302": "80000", "H-303": "70000" },
    justification: "Same as last year with rent revision.",
    status: "Approved",
    updatedAt: "2026-02-20",
  },
];

const sumAmounts = (a: Record<string, string>) => Object.values(a).reduce((n, v) => n + (Number(v) || 0), 0);

const REQ_PILL: Record<ReqStatus, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Returned: "bg-red-50 text-red-700",
};
const ReqPill: React.FC<{ value: ReqStatus }> = ({ value }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${REQ_PILL[value]}`}>{value}</span>
);


type Mode = "new" | "edit" | "view";

const RequestForm: React.FC<{
  mode: Mode;
  initial: ReqRow | null;
  onClose: () => void;
  onSave: (data: Omit<ReqRow, "id" | "updatedAt">, status: ReqStatus) => void;
}> = ({ mode, initial, onClose, onSave }) => {
  const readOnly = mode === "view";
  const [planCode, setPlanCode] = useState(initial?.planCode ?? OPEN_PLANS[0]?.code ?? "");
  const plan = PLANS.find((p) => p.code === planCode);
  const [amounts, setAmounts] = useState<Record<string, string>>(
    initial?.amounts ?? Object.fromEntries(LINES.map((l) => [l.id, l.control === "Fixed" ? String(l.fixed) : ""])),
  );
  const [justification, setJustification] = useState(initial?.justification ?? "");

  const target = TARGETS[planCode] ?? 0;
  const requested = sumAmounts(amounts);
  const remaining = target - requested;

  const setAmount = (l: Line, v: string) => {
    if (l.control === "Fixed") return;
    const n = Number(v);
    setAmounts((p) => ({ ...p, [l.id]: l.control === "Capped" && n > l.cap ? String(l.cap) : v }));
  };

  const save = (status: ReqStatus) => {
    onSave(
      { planCode, planName: plan?.name ?? "", financialYear: plan?.financialYear ?? "", target, amounts, justification, status },
      status,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Branch budget request" className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-[var(--card,#fff)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-main">
            {mode === "new" ? "Add branch budget requirements" : mode === "edit" ? `Edit ${initial?.id}` : `Request ${initial?.id}`}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-main">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <section className={`${sectionCard} p-4`}>
            <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-4">
              <div className="col-span-2">
                <Field label="Budget plan">
                  <select value={planCode} onChange={(e) => setPlanCode(e.target.value)} disabled={mode !== "new"} className={inputCls} aria-label="Budget plan">
                    {(mode === "new" ? OPEN_PLANS : PLANS.filter((p) => p.code === planCode)).map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} · {p.name} ({p.financialYear})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <ReadOnly label="Branch" value={`${BRANCH.name} (${BRANCH.code})`} />
              <ReadOnly label="Input deadline" value={plan ? formatDate(plan.deadline) : "—"} />
            </div>
          </section>

          {/* Head wise requirements */}
          <section className={`${sectionCard} overflow-x-auto`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                  <th className="px-4 py-2">Budget head</th>
                  <th className="px-4 py-2 text-right">Previous budget</th>
                  <th className="px-4 py-2 text-right">Previous actual</th>
                  <th className="px-4 py-2">Limit</th>
                  <th className="w-48 px-4 py-2 text-right">Requested amount</th>
                </tr>
              </thead>
              <tbody>
                {LINES.map((l) => (
                  <tr key={l.id} className="border-t border-[var(--border)] text-main">
                    <td className="px-4 py-2">
                      <span className="block font-medium">{l.name}</span>
                      <span className="block text-xs text-muted">{l.code}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-muted">{fmt(l.prevBudget)}</td>
                    <td className="px-4 py-2 text-right text-muted">{fmt(l.prevActual)}</td>
                    <td className="px-4 py-2">
                      <StatusPill value={l.control} />
                      {l.control === "Fixed" && <span className="ml-1.5 text-xs text-muted">{inr(l.fixed)}</span>}
                      {l.control === "Capped" && <span className="ml-1.5 text-xs text-muted">up to {inr(l.cap)}</span>}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        disabled={readOnly || l.control === "Fixed"}
                        value={amounts[l.id] ?? ""}
                        onChange={(e) => setAmount(l, e.target.value)}
                        placeholder="₹0"
                        aria-label={`Requested amount for ${l.name}`}
                        className={`${inputCls} py-1.5 text-right disabled:opacity-60`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--border)]/10 font-semibold text-main">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{fmt(LINES.reduce((n, l) => n + l.prevBudget, 0))}</td>
                  <td className="px-4 py-2 text-right">{fmt(LINES.reduce((n, l) => n + l.prevActual, 0))}</td>
                  <td />
                  <td className="px-4 py-2 text-right">{fmt(requested)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <Field label="Justification">
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder="Explain the branch's budget requirements"
              className={`${inputCls} resize-none disabled:opacity-60`}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button type="button" onClick={onClose} className={btnGhost}>
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <>
              <button type="button" onClick={() => save("Draft")} className={`${btnGhost} inline-flex items-center gap-1.5`}>
                <Save size={14} /> Save draft
              </button>
              <button type="button" onClick={() => save("Submitted")} className={btnPrimary}>
                <Send size={14} /> Submit to Zonal Manager
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


const BranchBudgetRequest: React.FC = () => {
  const { can } = usePermission();
  const [rows, setRows] = useState<ReqRow[]>(SEED);
  const [modal, setModal] = useState<{ mode: Mode; row: ReqRow | null } | null>(null);

  const { tableProps } = useLocalTable(rows, {
    searchKeys: ["id", "planCode", "planName", "financialYear", "status"],
    sortBy: "updatedAt",
    filters: [{ key: "status", label: "Status", options: ["Draft", "Submitted", "Approved", "Returned"].map((v) => ({ label: v, value: v })) }],
  });

  const handleSave = (data: Omit<ReqRow, "id" | "updatedAt">, status: ReqStatus) => {
    const editing = modal?.row;
    if (editing) {
      setRows((p) => p.map((r) => (r.id === editing.id ? { ...r, ...data, updatedAt: today() } : r)));
    } else {
      setRows((p) => [{ ...data, id: `REQ-${Date.now().toString().slice(-4)}`, updatedAt: today() }, ...p]);
    }
    showSuccess(status === "Submitted" ? "Request submitted to Zonal Manager" : "Request saved as draft");
  };

  const columns: Column<ReqRow>[] = useMemo(
    () => [
      { key: "id", header: "Request ID", align: "left", sortable: true, render: (r) => <div className="whitespace-nowrap py-1.5 font-medium">{r.id}</div> },
      {
        key: "planCode",
        header: "Budget plan",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block">{r.planName}</span>
            <span className="block text-xs text-muted">{r.planCode} · {r.financialYear}</span>
          </div>
        ),
      },
      { key: "target", header: "Your target", align: "right", sortable: true, render: (r) => <div className="whitespace-nowrap py-1.5">{inr(r.target)}</div> },
      { key: "requested", header: "Requested", align: "right", render: (r) => <div className="whitespace-nowrap py-1.5 font-medium">{inr(sumAmounts(r.amounts))}</div> },
      { key: "status", header: "Status", align: "center", render: (r) => <div className="flex justify-center py-1.5"><ReqPill value={r.status} /></div> },
      { key: "updatedAt", header: "Last updated", align: "center", sortable: true, render: (r) => <div className="py-1.5">{formatDate(r.updatedAt)}</div> },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (r) => {
          const editable = r.status === "Draft" || r.status === "Returned";
          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton type="view" iconOnly onClick={(e) => { e?.stopPropagation(); setModal({ mode: "view", row: r }); }} />
              <PermissionGate module={MODULE} action="write">
                <ActionButton
                  type="edit"
                  iconOnly
                  disabled={!editable}
                  title={editable ? "Edit request" : "Only draft or returned requests can be edited"}
                  onClick={(e) => { e?.stopPropagation(); setModal({ mode: "edit", row: r }); }}
                />
              </PermissionGate>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        rowKey={(r) => r.id}
        tableId="branch-budget-requests"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(MODULE, "create")}
        addLabel="Add Request"
        onAdd={() => setModal({ mode: "new", row: null })}
        enableColumnSelector
        enableExport={false}
        onRowDoubleClick={(r) => setModal({ mode: "view", row: r })}
        {...tableProps}
      />
      {modal && <RequestForm key={modal.row?.id ?? "new"} mode={modal.mode} initial={modal.row} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
};

export default BranchBudgetRequest;