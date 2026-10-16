import React, { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import Table from "../../../components/ui/Table/Table";
import { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showSuccess } from "../../../utils/alert";
import { FormModal, Field, inputCls, staticFetcher, useLocalTable, StatusPill, formatDate, inr, today, HEADS, PARTICIPANTS, LIVE_PLANS } from "../sharedbudget";

const MODULE = "Budget";
const FUNDING = ["Contingency reserve", "Central savings", "Special Board allocation"];

interface SupRow {
  no: string;
  date: string;
  plan: string;
  unit: string;
  head: string;
  amount: number;
  funding: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const SEED: SupRow[] = [
  { no: "SB-0001", date: "2026-09-12", plan: "BUD-2627-001", unit: "Dehradun Rajpur Road", head: "IT Equipment", amount: 100000, funding: "Contingency reserve", reason: "Server replacement after failure", status: "Approved" },
  { no: "SB-0002", date: "2026-10-05", plan: "BUD-2627-001", unit: "Roorkee", head: "Electricity", amount: 80000, funding: "Central savings", reason: "Tariff revision", status: "Pending" },
  { no: "SB-0003", date: "2026-10-09", plan: "BUD-2627-001", unit: "Information Technology", head: "IT Equipment", amount: 1200000, funding: "Special Board allocation", reason: "Core banking upgrade", status: "Pending" },
  { no: "SB-0004", date: "2026-10-14", plan: "BUD-2627-001", unit: "Mathura", head: "Staff Training", amount: 45000, funding: "Contingency reserve", reason: "Additional compliance training", status: "Rejected" },
];

const SupplementaryBudget: React.FC = () => {
  const { can } = usePermission();
  const [rows, setRows] = useState<SupRow[]>(SEED);
  const [open, setOpen] = useState(false);

  const [plan, setPlan] = useState(LIVE_PLANS[0]);
  const [unit, setUnit] = useState("");
  const [head, setHead] = useState("");
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(FUNDING[0]);
  const [reason, setReason] = useState("");

  const { tableProps } = useLocalTable(rows, {
    searchKeys: ["no", "plan", "unit", "head", "funding"],
    sortBy: "no",
    filters: [
      { key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"].map((v) => ({ label: v, value: v })) },
      { key: "funding", label: "Funding", options: FUNDING.map((v) => ({ label: v, value: v })) },
    ],
  });

  const openForm = () => {
    setPlan(LIVE_PLANS[0]); setUnit(""); setHead(""); setAmount(""); setFunding(FUNDING[0]); setReason("");
    setOpen(true);
  };

  const submit = () => {
    setRows((p) => [{ no: `SB-${String(p.length + 1).padStart(4, "0")}`, date: today(), plan: plan.split(" · ")[0], unit, head, amount: Number(amount) || 0, funding, reason, status: "Pending" }, ...p]);
    showSuccess("Supplementary budget submitted for approval");
    setOpen(false);
  };

  const decide = (no: string, status: "Approved" | "Rejected") => {
    setRows((p) => p.map((r) => (r.no === no ? { ...r, status } : r)));
    showSuccess(`Supplementary budget ${status.toLowerCase()}`);
  };

  const columns: Column<SupRow>[] = useMemo(
    () => [
      {
        key: "no",
        header: "Request",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block font-medium">{r.no}</span>
            <span className="block text-xs text-muted">{formatDate(r.date)} · {r.plan}</span>
          </div>
        ),
      },
      { key: "unit", header: "Branch / Department", align: "left", sortable: true, render: (r) => <div className="py-1.5">{r.unit}</div> },
      { key: "head", header: "Budget head", align: "left", sortable: true, render: (r) => <div className="py-1.5">{r.head}</div> },
      { key: "amount", header: "Amount", align: "right", sortable: true, render: (r) => <div className="whitespace-nowrap py-1.5 font-medium">{inr(r.amount)}</div> },
      { key: "reason", header: "Reason", align: "left", render: (r) => <div className="max-w-[260px] truncate py-1.5">{r.reason}</div> },
      { key: "status", header: "Status", align: "center", render: (r) => <div className="flex justify-center py-1.5"><StatusPill value={r.status} /></div> },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (r) => {
          const pending = r.status === "Pending" && can(MODULE, "write");
          return (
            <div className={pending ? "" : "pointer-events-none opacity-40"}>
              <ActionMenu
                showDownload={false}
                customActions={
                  pending
                    ? [
                        { label: "Approve", icon: <Check size={14} />, onClick: () => decide(r.no, "Approved") },
                        { label: "Reject", icon: <X size={14} />, danger: true, onClick: () => decide(r.no, "Rejected") },
                      ]
                    : []
                }
              />
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
        rowKey={(r) => r.no}
        tableId="budget-supplementary"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(MODULE, "create")}
        addLabel="New Supplementary Budget"
        onAdd={openForm}
        enableColumnSelector
        enableExport={false}
        {...tableProps}
      />

      {open && (
        <FormModal title="New supplementary budget" submitLabel="Submit for approval" onClose={() => setOpen(false)} onSubmit={submit} wide>
          <SearchSelect2 label="Budget plan" required value={plan} onChange={(v) => setPlan(v || "")} fetchOptions={staticFetcher(LIVE_PLANS)} placeholder="Select plan" />
          <div className="grid grid-cols-2 items-start gap-4">
            <SearchSelect2 label="Branch / Department" required value={unit} onChange={(v) => setUnit(v || "")} fetchOptions={staticFetcher(PARTICIPANTS.map((p) => p.name))} placeholder="Select" />
            <SearchSelect2 label="Budget head" required value={head} onChange={(v) => setHead(v || "")} fetchOptions={staticFetcher(HEADS.map((h) => h.name))} placeholder="Select head" />
            <ModalInput label="Amount" name="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0" />
          </div>
          <Field label="Reason">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why is additional budget needed?" className={`${inputCls} resize-none`} />
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default SupplementaryBudget;