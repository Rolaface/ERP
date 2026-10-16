import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Lock, Save, Search } from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { showSuccess } from "../../../utils/alert";
import {
  inputCls,
  sectionCard,
  btnGhost,
  btnPrimary,
  staticFetcher,
  fmt,
  inr,
  Field,
  GROUPS,
  GROUP_LABEL,
  HEADS,
  PARTICIPANTS,
  WORKFLOWS,
  type ControlLevel,
} from "../sharedbudget";

// ─── Config ───────────────────────────────────────────────────────────────────

interface CreateBudgetPlanProps {
  onBack: () => void;
  onSaved?: (payload: any) => void;
  currentUser?: string;
  /** Month the financial year starts (1-12). April = 4 for India. */
  fyStartMonth?: number;
}

type Mode = "Branch" | "Department";
type Split = "last_year" | "equal" | "manual";

const BUDGET_TYPES = ["Operating", "Capital", "Consolidated"];
const PHASING = ["Annual", "Half-yearly", "Quarterly", "Monthly"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
const STEPS = ["Basics", "Participants", "Targets and rules", "Review"];
const PLAN_WORKFLOWS = WORKFLOWS.filter((w) => w.appliesTo === "Budget plan");

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fyLabel = (y: number) => `FY ${y}–${pad((y + 1) % 100)}`;
const fyRange = (label: string, startMonth: number) => {
  const y = parseInt(label.slice(3, 7), 10);
  return { start: ymd(new Date(y, startMonth - 1, 1)), end: ymd(new Date(y + 1, startMonth - 1, 0)) };
};
const currentFyStart = (startMonth: number) => {
  const now = new Date();
  return now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
};

const ReadOnlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Field label={label}>
    <div className="flex h-[38px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--border)]/15 px-3 text-sm text-main">
      <span className="truncate">{value}</span>
      <Lock size={14} className="shrink-0 text-muted" />
    </div>
  </Field>
);

const Stepper: React.FC<{ step: number; onGo: (i: number) => void }> = ({ step, onGo }) => (
  <ol className="mb-4 flex flex-wrap items-center gap-2" aria-label="Plan steps">
    {STEPS.map((label, i) => {
      const done = i < step;
      const current = i === step;
      return (
        <li key={label} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGo(i)}
            aria-current={current ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              current ? "border-primary bg-primary/10 font-medium text-primary" : "border-[var(--border)] text-main hover:bg-[var(--border)]/15"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${current || done ? "bg-primary text-white" : "bg-[var(--border)]/40 text-muted"}`}>
              {done ? <Check size={12} /> : i + 1}
            </span>
            {label}
          </button>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-[var(--border)]" aria-hidden />}
        </li>
      );
    })}
  </ol>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const CreateBudgetPlan: React.FC<CreateBudgetPlanProps> = ({ onBack, onSaved, currentUser = "You", fyStartMonth = 4 }) => {
  const fyOptions = useMemo(() => {
    const y = currentFyStart(fyStartMonth);
    return [y, y + 1].map(fyLabel);
  }, [fyStartMonth]);

  const [step, setStep] = useState(0);

  // Basics
  const [name, setName] = useState("");
  const [fy, setFy] = useState(fyOptions[0]);
  const [budgetType, setBudgetType] = useState("Operating");
  const [phasing, setPhasing] = useState("Annual");
  const [currency, setCurrency] = useState("INR");
  const [workflow, setWorkflow] = useState(PLAN_WORKFLOWS[0].name);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [customDates, setCustomDates] = useState(false);
  const [startDate, setStartDate] = useState(fyRange(fyOptions[0], fyStartMonth).start);
  const [endDate, setEndDate] = useState(fyRange(fyOptions[0], fyStartMonth).end);
  const [deadline, setDeadline] = useState("");

  // Participants
  const [mode, setMode] = useState<Mode>("Branch");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Targets and rules
  const [envelope, setEnvelope] = useState("");
  const [split, setSplit] = useState<Split>("last_year");
  const [growth, setGrowth] = useState("");
  const [inflation, setInflation] = useState("");
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<Record<string, { control: ControlLevel; cap: string }>>({});
  const [instructions, setInstructions] = useState("");

  // ── Derived ──
  const range = customDates ? { start: startDate, end: endDate } : fyRange(fy, fyStartMonth);
  const visibleGroups = GROUPS.filter((g) => budgetType === "Consolidated" || g.type === budgetType);
  const allocatedHeads = HEADS.filter((h) => groupIds.includes(h.group));
  const ruleOf = (id: string, control: ControlLevel, cap: number) => rules[id] ?? { control, cap: cap ? String(cap) : "" };

  const modeRows = PARTICIPANTS.filter(
    (p) => p.type === mode && (!search.trim() || `${p.code} ${p.name}`.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const clusters = Array.from(new Set(PARTICIPANTS.filter((p) => p.type === mode).map((p) => p.cluster)));
  const covered = PARTICIPANTS.filter((p) => selected.includes(p.code));
  const envelopeNum = Number(envelope) || 0;
  const allocated = covered.reduce((n, p) => n + (Number(targets[p.code]) || 0), 0);
  const unallocated = envelopeNum - allocated;
  const chain = PLAN_WORKFLOWS.find((w) => w.name === workflow)?.steps ?? [];
  const labels = mode === "Branch" ? { cluster: "Zone", place: "Region", owner: "Manager" } : { cluster: "Division", place: "Cost centre", owner: "Head" };

  // ── Handlers ──
  const changeFy = (v: string) => {
    setFy(v);
    if (!customDates && v) {
      const r = fyRange(v, fyStartMonth);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };
  const changeType = (v: string) => {
    setBudgetType(v);
    setGroupIds([]);
  };
  const toggleGroup = (id: string) => setGroupIds((p) => (p.includes(id) ? p.filter((g) => g !== id) : [...p, id]));

  const toggle = (code: string) => setSelected((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  const clusterCodes = (c: string) => PARTICIPANTS.filter((p) => p.type === mode && p.cluster === c).map((p) => p.code);
  const clusterOn = (c: string) => clusterCodes(c).every((x) => selected.includes(x));
  const toggleCluster = (c: string) => {
    const codes = clusterCodes(c);
    setSelected((p) => (clusterOn(c) ? p.filter((x) => !codes.includes(x)) : Array.from(new Set([...p, ...codes]))));
  };
  const selectShown = () => setSelected((p) => Array.from(new Set([...p, ...modeRows.map((r) => r.code)])));
  const allShownOn = modeRows.length > 0 && modeRows.every((r) => selected.includes(r.code));

  const applySplit = () => {
    if (split === "manual" || envelopeNum <= 0 || covered.length === 0) return;
    const out: Record<string, number> = {};
    const total = covered.reduce((n, p) => n + p.lastYearActual, 0);
    covered.forEach((p) => (out[p.code] = split === "last_year" ? Math.floor((envelopeNum * p.lastYearActual) / total) : Math.floor(envelopeNum / covered.length)));
    out[covered[0].code] += envelopeNum - Object.values(out).reduce((n, v) => n + v, 0);
    setTargets(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, String(v)])));
  };

  const save = (action: "draft" | "create" | "publish") => {
    onSaved?.({ name, fy, budgetType, phasing, currency, workflow, groupIds, range, deadline, participants: selected, envelope: envelopeNum, targets, rules, growth, inflation, instructions, action });
    showSuccess(action === "publish" ? "Plan published. Participants have been notified" : action === "create" ? "Budget plan created" : "Budget plan saved as draft");
    onBack();
  };

  // ── Steps ──
  const stepBasics = (
    <section className={`${sectionCard} p-5`}>
      <div className="grid grid-cols-12 items-start gap-4">
        <div className="col-span-12 md:col-span-6">
          <ModalInput label="Budget name" name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="For example: Annual Operating Budget" />
        </div>
        <div className="col-span-6 md:col-span-3">
          <SearchSelect2 label="Financial year" required value={fy} onChange={(v) => changeFy(v || "")} fetchOptions={staticFetcher(fyOptions)} placeholder="Select year" />
        </div>
        <div className="col-span-6 md:col-span-3">
          <SearchSelect2 label="Budget type" required value={budgetType} onChange={(v) => changeType(v || "")} fetchOptions={staticFetcher(BUDGET_TYPES)} placeholder="Select type" />
        </div>

        <div className="col-span-6 md:col-span-4">
          <SearchSelect2 label="Phasing" required value={phasing} onChange={(v) => setPhasing(v || "")} fetchOptions={staticFetcher(PHASING)} placeholder="Select phasing" />
        </div>
        <div className="col-span-6 md:col-span-4">
          <SearchSelect2 label="Currency" required value={currency} onChange={(v) => setCurrency(v || "")} fetchOptions={staticFetcher(CURRENCIES)} placeholder="Select currency" />
        </div>
        <div className="col-span-6 md:col-span-4">
          <SearchSelect2 label="Approval workflow" required value={workflow} onChange={(v) => setWorkflow(v || "")} fetchOptions={staticFetcher(PLAN_WORKFLOWS.map((w) => w.name))} placeholder="Select workflow" />
        </div>

        <div className="col-span-12">
          <label className="mb-1 block text-xs font-medium text-muted">
            Budget head groups <span className="text-danger">*</span>
          </label>
          <div className="grid gap-2 md:grid-cols-3">
            {visibleGroups.map((g) => {
              const on = groupIds.includes(g.id);
              return (
                <label key={g.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${on ? "border-primary bg-primary/5" : "border-[var(--border)] hover:bg-[var(--border)]/10"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleGroup(g.id)} className="mt-0.5" />
                  <span>
                    <span className="block font-medium text-main">{g.label}</span>
                    <span className="block text-xs text-muted">{HEADS.filter((h) => h.group === g.id).length} budget heads</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 md:col-span-6">
          {customDates ? (
            <div className="grid grid-cols-2 gap-4">
              <ModalInput label="Start date" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <ModalInput label="End date" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          ) : (
            <ReadOnlyField label="Plan period" value={`${range.start} to ${range.end}`} />
          )}
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={customDates} onChange={(e) => setCustomDates(e.target.checked)} />
            Use custom dates instead of the financial year
          </label>
        </div>
        <div className="col-span-6 md:col-span-3">
          <ModalInput label="Input deadline" name="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
        </div>
        <div className="col-span-6 md:col-span-3">
          <ReadOnlyField label="Budget owner" value={currentUser} />
        </div>
      </div>
    </section>
  );

  const stepParticipants = (
    <section className={`${sectionCard} p-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="tablist" aria-label="Participant type">
          {(["Branch", "Department"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm ${mode === m ? "bg-primary/10 font-medium text-primary" : "text-muted hover:text-main"}`}
            >
              {m === "Branch" ? "Branches" : "Departments"}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{selected.length} selected</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or name" aria-label="Search" className={`${inputCls} pl-8`} />
        </div>
        {clusters.map((c) => {
          const on = clusterOn(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => toggleCluster(c)}
              className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-[var(--border)] text-main hover:bg-[var(--border)]/15"}`}
            >
              {on && <Check size={11} className="mr-1 inline" />}
              {c} ({clusterCodes(c).length})
            </button>
          );
        })}
        {selected.length > 0 && (
          <button type="button" onClick={() => setSelected([])} className="text-xs text-muted hover:text-main hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card,#fff)]">
            <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-muted">
              <th className="w-10 px-3 py-2">
                <input type="checkbox" aria-label="Select all shown" checked={allShownOn} onChange={() => (allShownOn ? setSelected((p) => p.filter((c) => !modeRows.some((r) => r.code === c))) : selectShown())} />
              </th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">{labels.cluster}</th>
              <th className="px-3 py-2">{labels.place}</th>
              <th className="px-3 py-2">{labels.owner}</th>
              <th className="px-3 py-2 text-right">Last year actual</th>
            </tr>
          </thead>
          <tbody>
            {modeRows.map((p) => {
              const on = selected.includes(p.code);
              return (
                <tr key={p.code} onClick={() => toggle(p.code)} className={`cursor-pointer border-t border-[var(--border)] text-main hover:bg-[var(--border)]/10 ${on ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select ${p.name}`} checked={on} onChange={() => toggle(p.code)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{p.code}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-muted">{p.cluster}</td>
                  <td className="px-3 py-2 text-muted">{p.place}</td>
                  <td className="px-3 py-2 text-muted">{p.owner}</td>
                  <td className="px-3 py-2 text-right text-muted">{fmt(p.lastYearActual)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  const stepTargets = (
    <div className="flex flex-col gap-4">
      <section className={`${sectionCard} p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <ModalInput label={`Total amount (${currency})`} name="envelope" type="number" value={envelope} onChange={(e) => setEnvelope(e.target.value)} placeholder="Optional" />
          </div>
          <div className="w-32">
            <ModalInput label="Growth %" name="growth" type="number" value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="0" />
          </div>
          <div className="w-32">
            <ModalInput label="Inflation %" name="inflation" type="number" value={inflation} onChange={(e) => setInflation(e.target.value)} placeholder="0" />
          </div>
          <Field label="Split method">
            <select value={split} onChange={(e) => setSplit(e.target.value as Split)} className={`${inputCls} w-auto`} aria-label="Split method">
              <option value="last_year">In proportion to last year's actual</option>
              <option value="equal">Equal split</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <button type="button" disabled={split === "manual" || envelopeNum <= 0 || covered.length === 0} onClick={applySplit} className={btnGhost}>
            Apply split
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                <th className="px-3 py-2">Participant</th>
                <th className="px-3 py-2 text-right">Last year budget</th>
                <th className="px-3 py-2 text-right">Last year actual</th>
                <th className="w-44 px-3 py-2">Target ({currency})</th>
                <th className="px-3 py-2 text-right">Change</th>
                <th className="px-3 py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {covered.map((p) => {
                const t = Number(targets[p.code]) || 0;
                const change = p.lastYearActual > 0 && targets[p.code] ? ((t - p.lastYearActual) / p.lastYearActual) * 100 : null;
                return (
                  <tr key={p.code} className="border-t border-[var(--border)] text-main">
                    <td className="px-3 py-2">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">{p.code} · {p.cluster}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted">{fmt(p.lastYearBudget)}</td>
                    <td className="px-3 py-2 text-right text-muted">{fmt(p.lastYearActual)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={targets[p.code] ?? ""}
                        onChange={(e) => { setTargets((s) => ({ ...s, [p.code]: e.target.value })); setSplit("manual"); }}
                        aria-label={`Target for ${p.name}`}
                        className={`${inputCls} py-1.5 text-right`}
                      />
                    </td>
                    <td className={`px-3 py-2 text-right text-xs ${change == null ? "text-muted" : change > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted">{allocated > 0 && t > 0 ? `${((t / allocated) * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                );
              })}
              {covered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">Select participants in the previous step first.</td>
                </tr>
              )}
            </tbody>
            {covered.length > 0 && (
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--border)]/10 text-sm font-semibold text-main">
                  <td className="px-3 py-2">Total allocated</td>
                  <td className="px-3 py-2 text-right text-muted">{fmt(covered.reduce((n, p) => n + p.lastYearBudget, 0))}</td>
                  <td className="px-3 py-2 text-right text-muted">{fmt(covered.reduce((n, p) => n + p.lastYearActual, 0))}</td>
                  <td className="px-3 py-2 text-right">{fmt(allocated)}</td>
                  <td colSpan={2} className={`px-3 py-2 text-right text-xs ${envelopeNum > 0 && unallocated < 0 ? "text-danger" : "text-muted"}`}>
                    {envelopeNum > 0 ? (unallocated < 0 ? `${fmt(Math.abs(unallocated))} over` : `${fmt(unallocated)} unallocated`) : "No envelope set"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className={`${sectionCard} p-5`}>
        <div className="mb-3 text-sm font-semibold text-main">Rules for budget heads</div>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                <th className="px-3 py-2">Budget head</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2">GL code</th>
                <th className="w-36 px-3 py-2">Control</th>
                <th className="w-44 px-3 py-2">Cap per participant ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {allocatedHeads.map((h) => {
                const r = ruleOf(h.id, h.control, h.cap);
                return (
                  <tr key={h.id} className="border-t border-[var(--border)] text-main">
                    <td className="px-3 py-2 font-medium">{h.name}</td>
                    <td className="px-3 py-2 text-muted">{GROUP_LABEL[h.group]}</td>
                    <td className="whitespace-nowrap px-3 py-2">{h.glCode}</td>
                    <td className="px-3 py-2">
                      <select value={r.control} onChange={(e) => setRules((s) => ({ ...s, [h.id]: { ...r, control: e.target.value as ControlLevel } }))} aria-label={`Control for ${h.name}`} className={`${inputCls} py-1.5 text-xs`}>
                        {(["Free", "Capped", "Fixed"] as ControlLevel[]).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        disabled={r.control !== "Capped"}
                        value={r.control === "Capped" ? r.cap : ""}
                        onChange={(e) => setRules((s) => ({ ...s, [h.id]: { ...r, cap: e.target.value } }))}
                        aria-label={`Cap for ${h.name}`}
                        placeholder="—"
                        className={`${inputCls} py-1.5 text-right disabled:opacity-50`}
                      />
                    </td>
                  </tr>
                );
              })}
              {allocatedHeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">Select budget head groups in the first step.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Field label="Instructions for participants">
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} placeholder="What to prepare, how to justify increases, what to attach" className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </section>
    </div>
  );

  const stepReview = (
    <div className="flex flex-col gap-4">
      <section className={`${sectionCard} p-5`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
          {[
            ["Plan", name || "—"],
            ["Financial year", fy],
            ["Type", budgetType],
            ["Period", `${range.start} to ${range.end}`],
            ["Phasing", phasing],
            ["Budget head groups", groupIds.map((g) => GROUP_LABEL[g]).join(", ") || "—"],
            ["Input deadline", deadline || "—"],
            ["Participants", `${selected.length} selected`],
            ["Total amount", envelopeNum > 0 ? `${fmt(envelopeNum)} ${currency}` : "Not set"],
            ["Allocated", `${fmt(allocated)} ${currency}`],
            ["Owner", currentUser],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-medium text-main">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${sectionCard} p-5`}>
        <div className="mb-3 text-sm font-semibold text-main">Approval chain · {workflow}</div>
        <div className="flex flex-wrap items-center gap-2">
          {chain.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted">→</span>}
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-sm">
                {s.role}
                {s.above > 0 && <span className="text-xs text-muted"> · above {inr(s.above)}</span>}
              </span>
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-4">
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft size={14} /> Back to budget plans
        </button>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-main">Create budget plan</h2>
          <span className="rounded-full bg-[var(--border)]/40 px-2 py-0.5 text-xs text-muted">Draft</span>
        </div>

        <Stepper step={step} onGo={setStep} />
        {step === 0 && stepBasics}
        {step === 1 && stepParticipants}
        {step === 2 && stepTargets}
        {step === 3 && stepReview}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--card,#fff)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
          <span>Participants <span className="font-semibold text-main">{selected.length}</span></span>
          <span>Head groups <span className="font-semibold text-main">{groupIds.length}</span></span>
          <span>Envelope <span className="font-semibold text-main">{envelopeNum > 0 ? `${fmt(allocated)} of ${fmt(envelopeNum)}` : "Not set"}</span></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className={btnGhost}>Cancel</button>
          <button type="button" onClick={() => save("draft")} className={`${btnGhost} inline-flex items-center gap-1.5`}>
            <Save size={14} /> Save as draft
          </button>
          {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className={btnGhost}>Back</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className={btnPrimary}>Next</button>
          ) : (
            <>
              <button type="button" onClick={() => save("create")} className={btnGhost}>Create plan</button>
              <button type="button" onClick={() => save("publish")} className={btnPrimary}>Create and publish</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBudgetPlan;