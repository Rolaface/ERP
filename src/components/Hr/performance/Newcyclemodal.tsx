import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  ModalInput,
  ModalSelect,
  ModalTextarea,
} from "../../../components/ui/modal/modalComponent";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface NewCyclePayload {
  name: string;
  frequency: string;
  startDate: string;
  endDate: string;
  department: string;
  template: string;
  description: string;
}

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: NewCyclePayload) => void;
  modalId?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "All Departments",
  "Engineering",
  "Design",
  "Sales",
  "HR",
  "Finance",
  "Operations",
];

const FREQUENCIES = ["Yearly", "Half-Yearly", "Quarterly", "Monthly"];

const TEMPLATES = [
  "Engineering — Standard",
  "Design — Standard",
  "Sales — Standard",
  "HR — Standard",
  "Custom / No Template",
];

const EMPTY_FORM: NewCyclePayload = {
  name: "",
  frequency: "Yearly",
  startDate: "",
  endDate: "",
  department: "All Departments",
  template: "Custom / No Template",
  description: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/** Auto-generate cycle name from frequency + start date */
const autoName = (frequency: string, startDate: string): string => {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  switch (frequency) {
    case "Yearly":      return `Annual Review ${year}`;
    case "Half-Yearly": return `H${d.getMonth() < 6 ? 1 : 2} Review ${year}`;
    case "Quarterly":   return `Q${q} Review ${year}`;
    case "Monthly":     return `${d.toLocaleString("default", { month: "long" })} Review ${year}`;
    default:            return "";
  }
};

/** Auto-calculate end date from frequency + start date */
const autoEndDate = (frequency: string, startDate: string): string => {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  switch (frequency) {
    case "Yearly":      d.setFullYear(d.getFullYear() + 1);  break;
    case "Half-Yearly": d.setMonth(d.getMonth() + 6);        break;
    case "Quarterly":   d.setMonth(d.getMonth() + 3);        break;
    case "Monthly":     d.setMonth(d.getMonth() + 1);        break;
  }
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

// ─── Validation ──────────────────────────────────────────────────────────────────

interface Errors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

const validate = (form: NewCyclePayload): Errors => {
  const errors: Errors = {};
  if (!form.name.trim())     errors.name      = "Cycle name is required";
  if (!form.startDate)       errors.startDate = "Start date is required";
  if (!form.endDate)         errors.endDate   = "End date is required";
  if (form.startDate && form.endDate && form.endDate <= form.startDate)
    errors.endDate = "End date must be after start date";
  return errors;
};

// ─── Field group label ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1 mb-2">
    {children}
  </p>
);

// ─── Main Component ──────────────────────────────────────────────────────────────

const NewCycleModal = ({
  isOpen,
  onClose,
  onSave,
  modalId = "new-cycle",
}: NewCycleModalProps) => {
  const [form, setForm]     = useState<NewCyclePayload>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const set = (field: keyof NewCyclePayload, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-fill name when frequency or startDate changes
      if (field === "frequency" || field === "startDate") {
        const freq  = field === "frequency" ? value : prev.frequency;
        const start = field === "startDate"  ? value : prev.startDate;
        const generated = autoName(freq, start);
        if (generated && (!prev.name || prev.name === autoName(prev.frequency, prev.startDate))) {
          next.name = generated;
        }
        // Auto-fill end date
        if (start) {
          next.endDate = autoEndDate(freq, start);
        }
      }

      return next;
    });
    setTouched((prev) => new Set(prev).add(field));
  };

  const handleSave = () => {
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Mark all as touched to show errors
      setTouched(new Set(Object.keys(form)));
      return;
    }
    onSave(form);
    // Reset
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setTouched(new Set());
    onClose();
  };

  const handleClose = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setTouched(new Set());
    onClose();
  };

  const showError = (field: keyof Errors) =>
    touched.has(field) && errors[field]
      ? <p className="text-[10px] text-red-500 mt-0.5">{errors[field]}</p>
      : null;

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footer = (
    <div className="flex items-center justify-between w-full">
      <button onClick={handleClose} className="btn btn-outline text-sm px-4 h-8">
        Cancel
      </button>
      <button onClick={handleSave} className="btn btn-primary text-sm px-5 h-8">
        Create Cycle
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title="New Appraisal Cycle"
      subtitle="Set up a new performance review cycle"
      icon={RefreshCw}
      maxWidth="xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-4 pb-2">

        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <SectionLabel>Basic Info</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <ModalSelect
              label="Frequency"
              value={form.frequency}
              onChange={(e) => set("frequency", e.target.value)}
              options={FREQUENCIES.map((f) => ({ label: f, value: f }))}
            />
          </div>
          <div>
            <ModalSelect
              label="Department"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
            />
          </div>
        </div>

        {/* Cycle name — auto-filled but editable */}
        <div>
          <div className="relative">
            <ModalInput
              label="Cycle Name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Annual Review 2025"
            />
            {form.name && (
              <span
                title="Auto-generated from frequency & start date"
                className="absolute right-2 top-7 text-[9px] text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-full font-medium select-none"
              >
                auto
              </span>
            )}
          </div>
          {showError("name")}
        </div>

        {/* ── Dates ──────────────────────────────────────────────────────── */}
        <SectionLabel>Period</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <ModalInput
              label="Start Date"
              type="date"
              required
              name="startDate"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
            {showError("startDate")}
          </div>
          <div>
            <ModalInput
              label="End Date"
              type="date"
              required
              name="endDate"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
            {showError("endDate")}
          </div>
        </div>

        {/* Date range preview */}
        {form.startDate && form.endDate && !errors.endDate && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] bg-[var(--row-hover)] rounded-lg px-3 py-2">
            <span>📅</span>
            <span>
              {new Date(form.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(form.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="ml-auto font-medium text-[var(--text)]">
              {Math.round(
                (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
              )} months
            </span>
          </div>
        )}

        {/* ── Template & Notes ───────────────────────────────────────────── */}
        <SectionLabel>Setup</SectionLabel>

        <ModalSelect
          label="KRA Template"
          value={form.template}
          onChange={(e) => set("template", e.target.value)}
          options={TEMPLATES.map((t) => ({ label: t, value: t }))}
        />

        <ModalTextarea
          label="Description (optional)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Any notes about this cycle..."
        />

      </div>
    </MinimizableModal>
  );
};

export default NewCycleModal;