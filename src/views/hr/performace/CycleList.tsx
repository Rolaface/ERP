import { useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import NewCycleModal, {
  type NewCyclePayload,
} from "./../../../components/Hr/performance/Newcyclemodal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Cycle {
  id: number;
  name: string;
  period: string;
  frequency: string;
  status: "Active" | "Draft" | "Completed";
}

interface CycleListProps {
  onViewCycle?: (id: number) => void;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────────

const INITIAL_CYCLES: Cycle[] = [
  {
    id: 1,
    name: "Annual Review 2025",
    period: "Jan 2025 – Dec 2025",
    frequency: "Yearly",
    status: "Active",
  },
  {
    id: 2,
    name: "Q1 Review 2026",
    period: "Jan 2026 – Mar 2026",
    frequency: "Quarterly",
    status: "Draft",
  },
  {
    id: 3,
    name: "Annual Review 2024",
    period: "Jan 2024 – Dec 2024",
    frequency: "Yearly",
    status: "Completed",
  },
  {
    id: 4,
    name: "Q4 Review 2025",
    period: "Oct 2025 – Dec 2025",
    frequency: "Quarterly",
    status: "Completed",
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Completed: "bg-[var(--row-hover)] text-[var(--muted)]",
};

// ─── Format date for display ─────────────────────────────────────────────────────

const formatPeriod = (start: string, end: string): string => {
  const s = new Date(start).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  const e = new Date(end).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  return `${s} – ${e}`;
};

// ─── Component ───────────────────────────────────────────────────────────────────

const CycleList = ({ onViewCycle }: CycleListProps) => {
  const [cycles, setCycles] = useState<Cycle[]>(INITIAL_CYCLES);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = cycles.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const total = cycles.length;
  const active = cycles.filter((c) => c.status === "Active").length;
  const pending = cycles.filter((c) => c.status === "Draft").length;

  const handleSaveCycle = (payload: NewCyclePayload) => {
    const newCycle: Cycle = {
      id: Date.now(),
      name: payload.name,
      period: formatPeriod(payload.startDate, payload.endDate),
      frequency: payload.frequency,
      status: "Draft",
    };
    setCycles((prev) => [newCycle, ...prev]);
  };

  const handleDelete = (id: number) =>
    setCycles((prev) => prev.filter((c) => c.id !== id));

  return (
    <>
      <div className="space-y-5 p-1">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Cycles", value: total },
            { label: "Active", value: active },
            { label: "Draft / Pending", value: pending },
          ].map((card) => (
            <div
              key={card.label}
              className="card border border-[var(--border)] rounded-xl p-4"
            >
              <p className="text-xs text-[var(--muted)] mb-1">{card.label}</p>
              <p className="text-2xl font-semibold text-[var(--text)]">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + New Cycle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-2 w-64 bg-card">
            <FaSearch className="text-[var(--muted)] text-sm shrink-0" />
            <input
              type="text"
              placeholder="Search cycles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm outline-none bg-transparent w-full text-[var(--text)]"
            />
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <FaPlus size={11} />
            New Cycle
          </button>
        </div>

        {/* Table */}
        <div className="app-surface rounded-xl overflow-hidden">
          {/* Header */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/10">
                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] font-bold uppercase tracking-wide">
                  Cycle Name
                </th>
                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] font-bold uppercase tracking-wide">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] font-bold uppercase tracking-wide">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] font-bold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-[var(--muted)]"
                  >
                    No cycles found
                  </td>
                </tr>
              ) : (
                filtered.map((cycle) => (
                  <tr
                    key={cycle.id}
                    className="border-b border-[var(--border)]/20 row-hover transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text)]">
                      {cycle.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {cycle.period}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {cycle.frequency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[cycle.status]}`}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onViewCycle?.(cycle.id)}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(cycle.id)}
                          className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
            Total: {filtered.length}
          </div>
        </div>
      </div>

      {/* New Cycle Modal */}
      <NewCycleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCycle}
        modalId="new-cycle-modal"
      />
    </>
  );
};

export default CycleList;
