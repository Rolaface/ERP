import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { ModalInput, ModalSelect, ModalTextarea } from "../../../components/ui/modal/modalComponent";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KRA {
  id: number;
  title: string;
  description: string;
  weightage: number;
  selfRating: number | null;
  selfComment: string;
  managerRating: number | null;
  managerComment: string;
}

interface AppraisalFormProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEE = {
  name: "Rohan Sharma",
  designation: "Senior Engineer",
  dept: "Engineering",
  cycle: "Annual Review 2025",
  period: "Jan 2025 – Dec 2025",
};

const INITIAL_KRAS: KRA[] = [
  { id: 1, title: "Technical Delivery",     description: "On-time delivery of assigned tasks and features",       weightage: 35, selfRating: null, selfComment: "", managerRating: null, managerComment: "" },
  { id: 2, title: "Code Quality",           description: "Code review score, test coverage, bug rate",            weightage: 25, selfRating: null, selfComment: "", managerRating: null, managerComment: "" },
  { id: 3, title: "Collaboration",          description: "Team participation, cross-functional work",             weightage: 20, selfRating: null, selfComment: "", managerRating: null, managerComment: "" },
  { id: 4, title: "Initiative & Learning",  description: "Self-driven improvements, new skills acquired",        weightage: 20, selfRating: null, selfComment: "", managerRating: null, managerComment: "" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor", 2: "Below Avg", 3: "Average", 4: "Good", 5: "Excellent",
};

const RATING_COLOR: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-300",
  2: "bg-orange-100 text-orange-700 border-orange-300",
  3: "bg-yellow-100 text-yellow-700 border-yellow-300",
  4: "bg-blue-100 text-blue-700 border-blue-300",
  5: "bg-green-100 text-green-700 border-green-300",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Self Appraisal", "Manager Review", "Summary"];

const StepBar = ({ current }: { current: number }) => (
  <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)]">
    {STEPS.map((label, i) => {
      const done    = i < current;
      const active  = i === current;
      return (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all
              ${done   ? "bg-[var(--primary)] border-[var(--primary)] text-white"   : ""}
              ${active ? "border-[var(--primary)] text-[var(--primary)] bg-white"   : ""}
              ${!done && !active ? "border-[var(--border)] text-[var(--muted)] bg-card" : ""}
            `}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`text-[11px] font-medium
              ${active ? "text-[var(--primary)]" : done ? "text-[var(--text)]" : "text-[var(--muted)]"}
            `}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Rating Buttons ───────────────────────────────────────────────────────────

const RatingButtons = ({
  value, onChange, disabled = false,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((r) => (
      <button
        key={r}
        type="button"
        disabled={disabled}
        onClick={() => onChange(r)}
        className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-all
          ${value === r
            ? RATING_COLOR[r]
            : "bg-card border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {r}
      </button>
    ))}
    {value && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ml-1 ${RATING_COLOR[value]}`}>
        {RATING_LABELS[value]}
      </span>
    )}
  </div>
);

// ─── Score calc ───────────────────────────────────────────────────────────────

const calcScore = (kras: KRA[], type: "self" | "manager") => {
  const filled = kras.filter((k) =>
    type === "self" ? k.selfRating !== null : k.managerRating !== null
  );
  if (!filled.length) return null;
  const weighted = filled.reduce((sum, k) => {
    const r = type === "self" ? k.selfRating! : k.managerRating!;
    return sum + r * (k.weightage / 100);
  }, 0);
  return (weighted / 5 * 100).toFixed(1);
};

const getBand = (score: number) => {
  if (score >= 90) return { label: "Exceptional",    cls: "text-green-700 bg-green-100"  };
  if (score >= 75) return { label: "Exceeds Expect.", cls: "text-blue-700 bg-blue-100"   };
  if (score >= 60) return { label: "Meets Expect.",  cls: "text-yellow-700 bg-yellow-100"};
  if (score >= 40) return { label: "Needs Improv.",  cls: "text-orange-700 bg-orange-100"};
  return                  { label: "Unsatisfactory", cls: "text-red-700 bg-red-100"      };
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AppraisalFormModal = ({
  isOpen,
  onClose,
  modalId = "appraisal-form",
}: AppraisalFormProps) => {
  const [step, setStep]   = useState(0);
  const [kras, setKras]   = useState<KRA[]>(INITIAL_KRAS);
  const [selfNote, setSelfNote]       = useState("");
  const [managerNote, setManagerNote] = useState("");

  const updateKRA = (
    id: number,
    field: keyof KRA,
    value: string | number | null,
  ) => setKras((prev) =>
    prev.map((k) => k.id === id ? { ...k, [field]: value } : k)
  );

  const selfComplete    = kras.every((k) => k.selfRating !== null);
  const managerComplete = kras.every((k) => k.managerRating !== null);
  const selfScore       = calcScore(kras, "self");
  const managerScore    = calcScore(kras, "manager");

  // ── Step 0: Self Appraisal ─────────────────────────────────────────────────
  const renderSelf = () => (
    <div className="space-y-3">

      {/* Employee info strip */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--row-hover)] border border-[var(--border)]">
        <div className="w-9 h-9 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-sm font-bold text-[var(--primary)]">
          {MOCK_EMPLOYEE.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">{MOCK_EMPLOYEE.name}</p>
          <p className="text-[11px] text-[var(--muted)]">{MOCK_EMPLOYEE.designation} · {MOCK_EMPLOYEE.dept}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--muted)]">{MOCK_EMPLOYEE.cycle}</p>
          <p className="text-[10px] text-[var(--muted)]">{MOCK_EMPLOYEE.period}</p>
        </div>
      </div>

      {/* KRA rows */}
      <div className="space-y-2">
        {kras.map((kra, idx) => (
          <div
            key={kra.id}
            className="card rounded-xl border border-[var(--border)] p-3 space-y-2"
          >
            {/* KRA header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
                    KRA {idx + 1}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">Weightage: {kra.weightage}%</span>
                </div>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{kra.title}</p>
                <p className="text-[11px] text-[var(--muted)]">{kra.description}</p>
              </div>
            </div>

            {/* Self rating */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wide">
                Your Rating
              </p>
              <RatingButtons
                value={kra.selfRating}
                onChange={(v) => updateKRA(kra.id, "selfRating", v)}
              />
            </div>

            {/* Self comment */}
            <ModalTextarea
              label="Your Comment"
              value={kra.selfComment}
              onChange={(e) =>
                updateKRA(kra.id, "selfComment", e.target.value)
              }
              placeholder="What did you achieve in this area?"
            />
          </div>
        ))}
      </div>

      {/* Overall self note */}
      <ModalTextarea
        label="Overall Self Note (optional)"
        value={selfNote}
        onChange={(e) => setSelfNote(e.target.value)}
        placeholder="Anything you'd like to highlight overall..."
      />
    </div>
  );

  // ── Step 1: Manager Review ─────────────────────────────────────────────────
  const renderManager = () => (
    <div className="space-y-3">

      {/* Score summary from self */}
      {selfScore && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--row-hover)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--muted)]">Self score</div>
          <div className="text-lg font-bold text-[var(--primary)]">{selfScore}%</div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${getBand(Number(selfScore)).cls}`}>
            {getBand(Number(selfScore)).label}
          </div>
        </div>
      )}

      {/* KRA rows — side by side self (readonly) + manager */}
      <div className="space-y-2">
        {kras.map((kra, idx) => (
          <div
            key={kra.id}
            className="card rounded-xl border border-[var(--border)] p-3 space-y-2"
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
                KRA {idx + 1}
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">{kra.title}</span>
              <span className="text-[10px] text-[var(--muted)] ml-auto">{kra.weightage}%</span>
            </div>

            {/* Two-col: self (read) vs manager (editable) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Self — readonly */}
              <div className="space-y-1.5 p-2 rounded-lg bg-[var(--row-hover)]">
                <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wide">
                  Employee's Self Rating
                </p>
                <RatingButtons value={kra.selfRating} onChange={() => {}} disabled />
                {kra.selfComment && (
                  <p className="text-[10px] text-[var(--muted)] italic mt-1">
                    "{kra.selfComment}"
                  </p>
                )}
              </div>

              {/* Manager — editable */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wide">
                  Your Rating
                </p>
                <RatingButtons
                  value={kra.managerRating}
                  onChange={(v) => updateKRA(kra.id, "managerRating", v)}
                />
                <ModalTextarea
                  label="Manager Comment"
                  value={kra.managerComment}
                  onChange={(e) =>
                    updateKRA(kra.id, "managerComment", e.target.value)
                  }
                  placeholder="Your observation..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manager overall note */}
      <ModalTextarea
        label="Manager's Overall Note"
        value={managerNote}
        onChange={(e) => setManagerNote(e.target.value)}
        placeholder="Overall performance summary..."
      />
    </div>
  );

  // ── Step 2: Summary ────────────────────────────────────────────────────────
  const renderSummary = () => {
    const finalScore = managerScore
      ? ((Number(selfScore) * 0.4 + Number(managerScore) * 0.6)).toFixed(1)
      : selfScore;
    const band = finalScore ? getBand(Number(finalScore)) : null;

    return (
      <div className="space-y-4">

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Self Score",    value: selfScore    ? `${selfScore}%`    : "—" },
            { label: "Manager Score", value: managerScore ? `${managerScore}%` : "—" },
            { label: "Final Score",   value: finalScore   ? `${finalScore}%`   : "—" },
          ].map((c) => (
            <div key={c.label} className="card rounded-xl p-4 text-center border border-[var(--border)]">
              <p className="text-[11px] text-[var(--muted)] mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Band */}
        {band && (
          <div className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm ${band.cls}`}>
            Performance Band: {band.label}
          </div>
        )}

        {/* KRA breakdown table */}
        <div className="app-surface rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/10">
                {["KRA", "Weight", "Self", "Manager", "Weighted"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold uppercase tracking-wide text-[var(--muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kras.map((k) => {
                const weighted = k.managerRating !== null
                  ? ((k.selfRating! * 0.4 + k.managerRating * 0.6) * k.weightage / 100 / 5 * 100).toFixed(1)
                  : k.selfRating !== null
                    ? (k.selfRating * k.weightage / 100 / 5 * 100).toFixed(1)
                    : "—";
                return (
                  <tr key={k.id} className="border-b border-[var(--border)]/20 row-hover">
                    <td className="px-3 py-2.5 font-medium text-[var(--text)]">{k.title}</td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{k.weightage}%</td>
                    <td className="px-3 py-2.5">
                      {k.selfRating
                        ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${RATING_COLOR[k.selfRating]}`}>{k.selfRating}/5</span>
                        : <span className="text-[var(--muted)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {k.managerRating
                        ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${RATING_COLOR[k.managerRating]}`}>{k.managerRating}/5</span>
                        : <span className="text-[var(--muted)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[var(--primary)]">{weighted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {(selfNote || managerNote) && (
          <div className="grid grid-cols-2 gap-3">
            {selfNote && (
              <div className="card rounded-xl p-3 border border-[var(--border)]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">Employee Note</p>
                <p className="text-xs text-[var(--text)]">{selfNote}</p>
              </div>
            )}
            {managerNote && (
              <div className="card rounded-xl p-3 border border-[var(--border)]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">Manager Note</p>
                <p className="text-xs text-[var(--text)]">{managerNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Footer buttons ─────────────────────────────────────────────────────────
  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        disabled={step === 0}
        className="btn btn-outline text-sm px-4 h-8 disabled:opacity-40"
      >
        ← Back
      </button>

      <div className="flex items-center gap-2">
        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !selfComplete}
            className="btn btn-primary text-sm px-5 h-8 disabled:opacity-40"
          >
            {step === 0 ? "Submit Self & Continue →" : "View Summary →"}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="btn btn-primary text-sm px-5 h-8"
          >
            Finalise & Close
          </button>
        )}
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Performance Appraisal"
      subtitle={`${MOCK_EMPLOYEE.name} · ${MOCK_EMPLOYEE.cycle}`}
      icon={ClipboardList}
      maxWidth="4xl"
      height="600px"
      footer={footer}
      summaryBar={<StepBar current={step} />}
    >
      <div className="h-full overflow-y-auto space-y-1 pb-2">
        {step === 0 && renderSelf()}
        {step === 1 && renderManager()}
        {step === 2 && renderSummary()}
      </div>
    </MinimizableModal>
  );
};

export default AppraisalFormModal;