import { useState, useRef } from "react";
import { FaPlus, FaTrash, FaGripVertical, FaCopy, FaCheck } from "react-icons/fa";
import { ModalInput, ModalSelect, ModalTextarea } from "../../../components/ui/modal/modalComponent";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KRAItem {
  id: number;
  title: string;
  description: string;
  weightage: number;
  category: string;
}

interface Template {
  id: number;
  name: string;
  department: string;
  description: string;
  kras: KRAItem[];
  isDefault: boolean;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "All Departments", "Engineering", "Design", "Sales", "HR", "Finance", "Operations",
];

const KRA_CATEGORIES = ["Delivery", "Quality", "Collaboration", "Growth", "Leadership", "Customer"];

const MOCK_TEMPLATES: Template[] = [
  {
    id: 1,
    name: "Engineering — Standard",
    department: "Engineering",
    description: "Default KRA template for engineering roles",
    isDefault: true,
    kras: [
      { id: 1, title: "Technical Delivery",    description: "On-time delivery of assigned tasks and features",          weightage: 35, category: "Delivery"       },
      { id: 2, title: "Code Quality",          description: "Code review score, test coverage, bug rate",               weightage: 25, category: "Quality"        },
      { id: 3, title: "Collaboration",         description: "Team participation, cross-functional work",                weightage: 20, category: "Collaboration"  },
      { id: 4, title: "Initiative & Learning", description: "Self-driven improvements, new skills acquired",            weightage: 20, category: "Growth"         },
    ],
  },
  {
    id: 2,
    name: "Design — Standard",
    department: "Design",
    description: "Default KRA template for design roles",
    isDefault: false,
    kras: [
      { id: 1, title: "Design Quality",        description: "Visual output quality, user feedback scores",              weightage: 40, category: "Quality"        },
      { id: 2, title: "Delivery & Velocity",   description: "Handoff timelines, sprint deliverables",                   weightage: 25, category: "Delivery"       },
      { id: 3, title: "Stakeholder Collab",    description: "Cross-team communication, feedback incorporation",         weightage: 20, category: "Collaboration"  },
      { id: 4, title: "Innovation",            description: "New interaction patterns, creative problem solving",        weightage: 15, category: "Growth"         },
    ],
  },
  {
    id: 3,
    name: "Sales — Standard",
    department: "Sales",
    description: "Default KRA template for sales roles",
    isDefault: false,
    kras: [
      { id: 1, title: "Revenue Target",        description: "Achievement vs quarterly revenue target",                   weightage: 50, category: "Delivery"       },
      { id: 2, title: "Pipeline Health",       description: "Qualified leads, conversion rate, pipeline value",          weightage: 25, category: "Quality"        },
      { id: 3, title: "Customer Satisfaction", description: "NPS, CSAT scores from managed accounts",                   weightage: 25, category: "Customer"       },
    ],
  },
];

const EMPTY_KRA = (): KRAItem => ({
  id: Date.now(),
  title: "",
  description: "",
  weightage: 0,
  category: "Delivery",
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

const totalWeight = (kras: KRAItem[]) =>
  kras.reduce((sum, k) => sum + Number(k.weightage || 0), 0);

const WeightPill = ({ total }: { total: number }) => {
  const ok      = total === 100;
  const over    = total > 100;
  const cls     = ok ? "bg-green-100 text-green-700" : over ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700";
  const label   = ok ? "✓ 100%" : `${total}% ${over ? "(over)" : "(remaining: " + (100 - total) + "%)"}`
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
  );
};

// ─── KRA Row ────────────────────────────────────────────────────────────────────

interface KRARowProps {
  kra: KRAItem;
  index: number;
  onChange: (id: number, field: keyof KRAItem, value: string | number) => void;
  onDelete: (id: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
}

const KRARow = ({ kra, index, onChange, onDelete, onDragStart, onDragOver, onDrop }: KRARowProps) => (
  <div
    draggable
    onDragStart={() => onDragStart(index)}
    onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
    onDrop={onDrop}
    className="card border border-[var(--border)] rounded-xl p-3 space-y-2 group cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm"
  >
    {/* Row header */}
    <div className="flex items-center gap-2">
      <FaGripVertical className="text-[var(--muted)] opacity-40 group-hover:opacity-80 shrink-0 transition-opacity" size={12} />
      <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
        KRA {index + 1}
      </span>
      <div className="ml-auto flex items-center gap-1">
        {/* Weightage badge */}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
          ${kra.weightage > 0 ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--row-hover)] text-[var(--muted)]"}`}>
          {kra.weightage}%
        </span>
        <button
          onClick={() => onDelete(kra.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>

    {/* Fields */}
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-2">
        <ModalInput
          label="KRA Title"
          required
          value={kra.title}
          onChange={(e) => onChange(kra.id, "title", e.target.value)}
          placeholder="e.g. Technical Delivery"
        />
      </div>
      <ModalInput
        label="Weightage (%)"
        type="number"
        value={String(kra.weightage)}
        onChange={(e) => onChange(kra.id, "weightage", Number(e.target.value))}
        placeholder="e.g. 30"
      />
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-2">
        <ModalTextarea
          label="Description"
          value={kra.description}
          onChange={(e) => onChange(kra.id, "description", e.target.value)}
          placeholder="What will be measured in this area?"
        />
      </div>
      <ModalSelect
        label="Category"
        value={kra.category}
        onChange={(e) => onChange(kra.id, "category", e.target.value)}
        options={KRA_CATEGORIES.map((c) => ({ label: c, value: c }))}
      />
    </div>
  </div>
);

// ─── Template List Item ─────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}

const TemplateCard = ({ template, isSelected, onSelect }: TemplateCardProps) => {
  const total = totalWeight(template.kras);
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl border transition-all
        ${isSelected
          ? "border-[var(--primary)] bg-[var(--primary)]/5"
          : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-card hover:bg-[var(--row-hover)]"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isSelected ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
            {template.name}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">{template.department} · {template.kras.length} KRAs</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {template.isDefault && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">DEFAULT</span>
          )}
          <WeightPill total={total} />
        </div>
      </div>
    </button>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const TemplateBuilder = () => {
  const [templates, setTemplates]     = useState<Template[]>(MOCK_TEMPLATES);
  const [selectedId, setSelectedId]   = useState<number>(MOCK_TEMPLATES[0].id);
  const [saved, setSaved]             = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const dragFrom = useRef<number | null>(null);
  const dragTo   = useRef<number | null>(null);

  const selected = templates.find((t) => t.id === selectedId)!;

  // ── Template operations ──────────────────────────────────────────────────────

  const updateTemplate = (patch: Partial<Template>) =>
    setTemplates((prev) =>
      prev.map((t) => t.id === selectedId ? { ...t, ...patch } : t)
    );

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newT: Template = {
      id: Date.now(),
      name: newTemplateName.trim(),
      department: "All Departments",
      description: "",
      isDefault: false,
      kras: [EMPTY_KRA()],
    };
    setTemplates((prev) => [...prev, newT]);
    setSelectedId(newT.id);
    setNewTemplateName("");
    setShowNewForm(false);
  };

  const handleDuplicateTemplate = () => {
    const dup: Template = {
      ...selected,
      id: Date.now(),
      name: `${selected.name} (copy)`,
      isDefault: false,
      kras: selected.kras.map((k) => ({ ...k, id: Date.now() + k.id })),
    };
    setTemplates((prev) => [...prev, dup]);
    setSelectedId(dup.id);
  };

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) return;
    const remaining = templates.filter((t) => t.id !== selectedId);
    setTemplates(remaining);
    setSelectedId(remaining[0].id);
  };

  // ── KRA operations ───────────────────────────────────────────────────────────

  const updateKRA = (id: number, field: keyof KRAItem, value: string | number) =>
    updateTemplate({
      kras: selected.kras.map((k) =>
        k.id === id ? { ...k, [field]: value } : k
      ),
    });

  const addKRA = () =>
    updateTemplate({ kras: [...selected.kras, EMPTY_KRA()] });

  const deleteKRA = (id: number) =>
    updateTemplate({ kras: selected.kras.filter((k) => k.id !== id) });

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────

  const handleDragStart = (index: number) => { dragFrom.current = index; };
  const handleDragOver  = (index: number) => { dragTo.current   = index; };
  const handleDrop      = () => {
    if (dragFrom.current === null || dragTo.current === null) return;
    if (dragFrom.current === dragTo.current) return;
    const reordered = [...selected.kras];
    const [moved]   = reordered.splice(dragFrom.current, 1);
    reordered.splice(dragTo.current, 0, moved);
    updateTemplate({ kras: reordered });
    dragFrom.current = null;
    dragTo.current   = null;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const total = totalWeight(selected.kras);

  return (
    <div className="flex gap-4 h-full p-1" style={{ minHeight: "520px" }}>

      {/* ── Left: Template List ────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col gap-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Templates</p>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
          >
            <FaPlus size={10} />
          </button>
        </div>

        {/* New template inline form */}
        {showNewForm && (
          <div className="card border border-[var(--border)] rounded-xl p-2.5 space-y-2">
            <input
              autoFocus
              type="text"
              placeholder="Template name..."
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
              className="input-base text-xs h-8 w-full"
            />
            <div className="flex gap-1.5">
              <button onClick={handleAddTemplate} className="btn btn-primary text-[10px] px-3 h-7 flex-1">
                Create
              </button>
              <button onClick={() => setShowNewForm(false)} className="btn btn-outline text-[10px] px-3 h-7">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Template cards */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isSelected={t.id === selectedId}
              onSelect={() => setSelectedId(t.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right: Editor ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Editor header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Template name (inline edit) */}
            <input
              type="text"
              value={selected.name}
              onChange={(e) => updateTemplate({ name: e.target.value })}
              className="text-base font-semibold bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] outline-none text-[var(--text)] w-full pb-0.5 transition-colors"
            />
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selected.department}
                onChange={(e) => updateTemplate({ department: e.target.value })}
                className="input-base text-xs h-7 w-40"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <WeightPill total={total} />
              <span className="text-[11px] text-[var(--muted)]">{selected.kras.length} KRAs</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDuplicateTemplate}
              title="Duplicate template"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)]/30 transition-colors"
            >
              <FaCopy size={12} />
            </button>
            <button
              onClick={handleDeleteTemplate}
              title="Delete template"
              disabled={templates.length <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FaTrash size={12} />
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 text-xs px-4 h-8 rounded-lg font-medium transition-all
                ${saved
                  ? "bg-green-500 text-white"
                  : "btn btn-primary"
                }`}
            >
              {saved ? <><FaCheck size={10} /> Saved</> : "Save Template"}
            </button>
          </div>
        </div>

        {/* Template description */}
        <input
          type="text"
          value={selected.description}
          onChange={(e) => updateTemplate({ description: e.target.value })}
          placeholder="Add a description for this template..."
          className="input-base text-xs h-8"
        />

        {/* Weight progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
            <span>Total Weightage</span>
            <span className={total === 100 ? "text-green-600 font-semibold" : total > 100 ? "text-red-500 font-semibold" : ""}>
              {total} / 100%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
            <div
              className={`h-1.5 rounded-full transition-all ${
                total === 100 ? "bg-green-500" : total > 100 ? "bg-red-500" : "bg-[var(--primary)]"
              }`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
        </div>

        {/* KRA list (scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: "340px" }}>
          {selected.kras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--muted)] text-sm gap-2">
              <p>No KRAs yet.</p>
              <button onClick={addKRA} className="btn btn-outline text-xs px-4 h-8">
                + Add First KRA
              </button>
            </div>
          ) : (
            selected.kras.map((kra, idx) => (
              <KRARow
                key={kra.id}
                kra={kra}
                index={idx}
                onChange={updateKRA}
                onDelete={deleteKRA}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>

        {/* Add KRA button */}
        <button
          onClick={addKRA}
          className="flex items-center justify-center gap-2 w-full border border-dashed border-[var(--border)] rounded-xl py-2.5 text-xs text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
          <FaPlus size={10} /> Add KRA
        </button>
      </div>

    </div>
  );
};

export default TemplateBuilder;