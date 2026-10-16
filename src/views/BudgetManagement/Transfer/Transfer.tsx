import React, { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import Table from "../../../components/ui/Table/Table";
import { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showSuccess } from "../../../utils/alert";
import { FormModal, Field, ReadOnly, inputCls, staticFetcher, useLocalTable, StatusPill, formatDate, inr, today, HEADS, PARTICIPANTS, LIVE_PLANS } from "../sharedbudget";

const MODULE = "Budget";

interface TransferRow {
  no: string;
  date: string;
  plan: string;
  fromUnit: string;
  fromHead: string;
  toUnit: string;
  toHead: string;
  amount: number;
  reason: string;
  requestedBy: string;
  status: "Pending" | "Approved" | "Rejected";
}

const SEED: TransferRow[] = [
  { no: "TR-0001", date: "2026-10-02", plan: "BUD-2627-001", fromUnit: "Meerut Main", fromHead: "Electricity", toUnit: "Meerut Cantt", toHead: "Electricity", amount: 40000, reason: "Higher summer load at Cantt", requestedBy: "Rohit Verma", status: "Approved" },
  { no: "TR-0002", date: "2026-10-08", plan: "BUD-2627-001", fromUnit: "Haridwar", fromHead: "Travel Expenses", toUnit: "Roorkee", toHead: "Staff Training", amount: 25000, reason: "Training batch added in Q3", requestedBy: "Pankaj Joshi", status: "Pending" },
  { no: "TR-0003", date: "2026-10-11", plan: "BUD-2627-001", fromUnit: "Agra Sadar", fromHead: "Stationery & Printing", toUnit: "Mathura", toHead: "Stationery & Printing", amount: 150000, reason: "Bulk print order for Mathura", requestedBy: "Vikas Sharma", status: "Pending" },
  { no: "TR-0004", date: "2026-10-13", plan: "BUD-2627-001", fromUnit: "Meerut Main", fromHead: "Housekeeping & Security", toUnit: "Dehradun Central", toHead: "Housekeeping & Security", amount: 60000, reason: "Contract revision", requestedBy: "Rohit Verma", status: "Rejected" },
];

const UNIT_NAMES = PARTICIPANTS.map((p) => p.name);
const HEAD_NAMES = HEADS.filter((h) => h.control !== "Fixed").map((h) => h.name);
const balanceOf = (unit: string, head: string) => (unit && head ? Math.round(((unit.length * 7919 + head.length * 104729) % 150000 + 50000) / 1000) * 1000 : 0);

const BudgetTransfer: React.FC = () => {
  const { can } = usePermission();
  const [rows, setRows] = useState<TransferRow[]>(SEED);
  const [open, setOpen] = useState(false);

  const [plan, setPlan] = useState(LIVE_PLANS[0]);
  const [fromUnit, setFromUnit] = useState("");
  const [fromHead, setFromHead] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [toHead, setToHead] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { tableProps } = useLocalTable(rows, {
    searchKeys: ["no", "plan", "fromUnit", "fromHead", "toUnit", "toHead", "requestedBy"],
    sortBy: "no",
    filters: [{ key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"].map((v) => ({ label: v, value: v })) }],
  });

  const openForm = () => {
    setPlan(LIVE_PLANS[0]);
    setFromUnit(""); setFromHead(""); setToUnit(""); setToHead(""); setAmount(""); setReason("");
    setOpen(true);
  };

  const submit = () => {
    setRows((p) => [
      { no: `TR-${String(p.length + 1).padStart(4, "0")}`, date: today(), plan: plan.split(" · ")[0], fromUnit, fromHead, toUnit, toHead, amount: Number(amount) || 0, reason, requestedBy: "You", status: "Pending" },
      ...p,
    ]);
    showSuccess("Transfer request submitted for approval");
    setOpen(false);
  };

  const decide = (no: string, status: "Approved" | "Rejected") => {
    setRows((p) => p.map((r) => (r.no === no ? { ...r, status } : r)));
    showSuccess(`Transfer ${status.toLowerCase()}`);
  };

  const columns: Column<TransferRow>[] = useMemo(
    () => [
      {
        key: "no",
        header: "Transfer",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block font-medium">{r.no}</span>
            <span className="block text-xs text-muted">{formatDate(r.date)} · {r.plan}</span>
          </div>
        ),
      },
      {
        key: "fromUnit",
        header: "From",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block">{r.fromUnit}</span>
            <span className="block text-xs text-muted">{r.fromHead}</span>
          </div>
        ),
      },
      {
        key: "toUnit",
        header: "To",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block">{r.toUnit}</span>
            <span className="block text-xs text-muted">{r.toHead}</span>
          </div>
        ),
      },
      { key: "amount", header: "Amount", align: "right", sortable: true, render: (r) => <div className="whitespace-nowrap py-1.5 font-medium">{inr(r.amount)}</div> },
      { key: "reason", header: "Reason", align: "left", render: (r) => <div className="max-w-[260px] truncate py-1.5">{r.reason}</div> },
      { key: "requestedBy", header: "Requested by", align: "left", sortable: true, render: (r) => <div className="py-1.5">{r.requestedBy}</div> },
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

  const available = balanceOf(fromUnit, fromHead);

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        rowKey={(r) => r.no}
        tableId="budget-transfers"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(MODULE, "create")}
        addLabel="New Transfer"
        onAdd={openForm}
        enableColumnSelector
        enableExport={false}
        {...tableProps}
      />

      {open && (
        <FormModal title="New budget transfer" submitLabel="Submit for approval" onClose={() => setOpen(false)} onSubmit={submit} wide>
          <SearchSelect2 label="Budget plan" required value={plan} onChange={(v) => setPlan(v || "")} fetchOptions={staticFetcher(LIVE_PLANS)} placeholder="Select plan" />
          <div className="grid grid-cols-2 items-start gap-4">
            <SearchSelect2 label="From" required value={fromUnit} onChange={(v) => setFromUnit(v || "")} fetchOptions={staticFetcher(UNIT_NAMES)} placeholder="Branch or department" />
            <SearchSelect2 label="From head" required value={fromHead} onChange={(v) => setFromHead(v || "")} fetchOptions={staticFetcher(HEAD_NAMES)} placeholder="Budget head" />
            <SearchSelect2 label="To" required value={toUnit} onChange={(v) => setToUnit(v || "")} fetchOptions={staticFetcher(UNIT_NAMES)} placeholder="Branch or department" />
            <SearchSelect2 label="To head" required value={toHead} onChange={(v) => setToHead(v || "")} fetchOptions={staticFetcher(HEAD_NAMES)} placeholder="Budget head" />
            <ReadOnly label="Available to transfer" value={available ? inr(available) : "—"} />
            <ModalInput label="Amount" name="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0" />
          </div>
          <Field label="Reason">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Business justification" className={`${inputCls} resize-none`} />
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default BudgetTransfer;