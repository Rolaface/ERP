import { useState } from "react";
import {
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaStar,
  FaRegStar,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaPaperPlane,
  FaRegClock,
  FaUserTie,
} from "react-icons/fa";
import AppraisalFormModal from "../../../components/Hr/performance/AppraisalFormModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type KRAStatus = "not-started" | "in-progress" | "submitted";

interface KRA {
  id: number;
  title: string;
  weightage: number;
  description: string;
  category: string;
  selfRating: number | null;
  selfComment: string;
  managerRating: number | null;
  managerComment: string;
}

// ─── Mock employee data ──────────────────────────────────────────────────────

const EMPLOYEE = {
  name: "Rohan Sharma",
  designation: "Senior Engineer",
  dept: "Engineering",
  manager: "Vikram Anand",
  cycle: "Annual Review 2025",
  template: "Engineering — Standard",
  dueDate: "31 Mar 2026",
  status: "Self Pending" as const,
};

const MOCK_KRAS: KRA[] = [
  {
    id: 1,
    title: "Code Quality",
    weightage: 25,
    description: "Maintain high code quality standards — clean, testable, well-documented code with peer reviews.",
    category: "Technical",
    selfRating: null,
    selfComment: "",
    managerRating: null,
    managerComment: "",
  },
  {
    id: 2,
    title: "Performance Optimization",
    weightage: 25,
    description: "Identify and resolve performance bottlenecks. Improve system throughput and reduce latency.",
    category: "Technical",
    selfRating: null,
    selfComment: "",
    managerRating: null,
    managerComment: "",
  },
  {
    id: 3,
    title: "Team Collaboration",
    weightage: 20,
    description: "Actively participate in team discussions, pair programming, and knowledge sharing sessions.",
    category: "Behavioral",
    selfRating: null,
    selfComment: "",
    managerRating: null,
    managerComment: "",
  },
  {
    id: 4,
    title: "Bug Resolution",
    weightage: 15,
    description: "Timely identification and resolution of bugs. Zero critical issues escaping to production.",
    category: "Technical",
    selfRating: null,
    selfComment: "",
    managerRating: null,
    managerComment: "",
  },
  {
    id: 5,
    title: "Ownership & Initiative",
    weightage: 15,
    description: "Take ownership of assigned areas. Proactively raise risks and propose solutions.",
    category: "Behavioral",
    selfRating: null,
    selfComment: "",
    managerRating: null,
    managerComment: "",
  },
];

// ─── Star Rating ─────────────────────────────────────────────────────────────

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  const labels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            style={{
              background: "none", border: "none", padding: 1,
              cursor: readonly ? "default" : "pointer",
              color: star <= display
                ? display >= 4 ? "#22c55e" : display >= 3 ? "var(--primary)" : "#f59e0b"
                : "var(--border)",
              fontSize: size,
              transition: "color 0.1s, transform 0.1s",
              transform: !readonly && star <= (hovered ?? 0) ? "scale(1.2)" : "scale(1)",
            }}
          >
            {star <= display ? <FaStar /> : <FaRegStar />}
          </button>
        ))}
      </div>
      {!readonly && display > 0 && (
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
          {labels[display]}
        </span>
      )}
      {readonly && value !== null && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{value}/5</span>
      )}
    </div>
  );
};

// ─── KRA Card ────────────────────────────────────────────────────────────────

const KRACard = ({
  kra,
  index,
  onUpdate,
  managerReleased,
}: {
  kra: KRA;
  index: number;
  onUpdate: (id: number, rating: number | null, comment: string) => void;
  managerReleased: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isRated = kra.selfRating !== null;

  const categoryColor: Record<string, string> = {
    Technical: "rgba(59,130,246,0.12)",
    Behavioral: "rgba(139,92,246,0.12)",
    Leadership: "rgba(245,158,11,0.12)",
  };
  const categoryText: Record<string, string> = {
    Technical: "#2563eb",
    Behavioral: "#7c3aed",
    Leadership: "#b45309",
  };

  return (
    <div
      className="card"
      style={{
        borderRadius: 12, padding: 0, overflow: "hidden",
        border: isRated ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--border)",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 16px", cursor: "pointer",
          background: isRated ? "rgba(34,197,94,0.04)" : "var(--card)",
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Index */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: isRated ? "#22c55e" : "var(--row-hover)",
          color: isRated ? "#fff" : "var(--muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, transition: "all 0.2s",
        }}>
          {isRated ? <FaCheckCircle style={{ fontSize: 13 }} /> : index + 1}
        </div>

        {/* Title + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{kra.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 5,
              background: categoryColor[kra.category] ?? "var(--row-hover)",
              color: categoryText[kra.category] ?? "var(--muted)",
            }}>
              {kra.category}
            </span>
          </div>
          {!expanded && kra.selfRating !== null && (
            <div style={{ marginTop: 3 }}>
              <StarRating value={kra.selfRating} readonly size={12} />
            </div>
          )}
        </div>

        {/* Weightage */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{kra.weightage}%</span>
          <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>weight</p>
        </div>

        {/* Chevron */}
        <div style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "16px" }}>
          {/* Description */}
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
            {kra.description}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: managerReleased ? "1fr 1fr" : "1fr", gap: 16 }}>
            {/* Self Rating */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Your Rating
              </p>
              <StarRating
                value={kra.selfRating}
                onChange={(v) => onUpdate(kra.id, v, kra.selfComment)}
              />
              <textarea
                value={kra.selfComment}
                onChange={(e) => onUpdate(kra.id, kra.selfRating, e.target.value)}
                placeholder="Add a comment (optional)..."
                className="input-base"
                style={{
                  marginTop: 10, fontSize: 12, resize: "vertical",
                  minHeight: 72, padding: "8px 12px", width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Manager Rating — only if released */}
            {managerReleased && (
              <div style={{ background: "var(--row-hover)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <FaUserTie style={{ fontSize: 11, color: "var(--muted)" }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Manager Rating
                  </p>
                </div>
                {kra.managerRating !== null ? (
                  <>
                    <StarRating value={kra.managerRating} readonly />
                    {kra.managerComment && (
                      <p style={{ fontSize: 12, color: "var(--text)", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
                        "{kra.managerComment}"
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>Not yet rated by manager</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const EmployeeAppraisalView = () => {
  const [kras, setKras] = useState<KRA[]>(MOCK_KRAS);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const managerReleased = false; // flip to true to show manager feedback panel

  const ratedCount = kras.filter((k) => k.selfRating !== null).length;
  const totalCount = kras.length;
  const allRated = ratedCount === totalCount;
  const avgSelf = ratedCount > 0
    ? (kras.filter((k) => k.selfRating !== null).reduce((s, k) => s + k.selfRating!, 0) / ratedCount).toFixed(1)
    : null;

  const handleUpdate = (id: number, rating: number | null, comment: string) => {
    setKras((prev) => prev.map((k) => k.id === id ? { ...k, selfRating: rating, selfComment: comment } : k));
  };

  const handleSubmit = () => {
    if (!allRated) return;
    setSubmitted(true);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 2px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── Hero card ── */}
        <div className="card" style={{
          borderRadius: 14, padding: 0, overflow: "hidden",
          background: "var(--card)",
        }}>
          {/* Top accent strip */}
          <div style={{ height: 4, background: "var(--gradient-primary)" }} />

          <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            {/* Left — employee info */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(59,130,246,0.12)", color: "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, flexShrink: 0,
                border: "2px solid rgba(59,130,246,0.2)",
              }}>
                RS
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{EMPLOYEE.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {EMPLOYEE.designation} · {EMPLOYEE.dept}
                </p>
              </div>
            </div>

            {/* Right — cycle info */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Cycle</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{EMPLOYEE.cycle}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Manager</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{EMPLOYEE.manager}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Due Date</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <FaRegClock style={{ fontSize: 11, color: "#f59e0b" }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#d97706" }}>{EMPLOYEE.dueDate}</p>
                </div>
              </div>
              {/* Status pill */}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
                background: submitted ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                color: submitted ? "#16a34a" : "#d97706",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: submitted ? "#22c55e" : "#f59e0b" }} />
                {submitted ? "Submitted" : "Self Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="card" style={{ borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              Self Rating Progress
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              <span style={{ fontWeight: 700, color: ratedCount === totalCount ? "#22c55e" : "var(--primary)" }}>
                {ratedCount}
              </span> / {totalCount} KRAs rated
              {avgSelf && (
                <span style={{ marginLeft: 12, fontWeight: 700, color: "var(--text)" }}>
                  Avg: {avgSelf}/5
                </span>
              )}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: allRated ? "#22c55e" : "var(--gradient-primary)",
              width: `${(ratedCount / totalCount) * 100}%`,
              transition: "width 0.4s ease",
              boxShadow: ratedCount > 0 ? "var(--glow-primary)" : "none",
            }} />
          </div>

          {/* KRA dots */}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {kras.map((k) => (
              <div key={k.id} title={k.title} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: k.selfRating !== null ? "#22c55e" : "var(--border)",
                transition: "background 0.25s",
              }} />
            ))}
          </div>
        </div>

        {/* ── Info banner (if not submitted) ── */}
        {!submitted && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "rgba(59,130,246,0.07)", borderRadius: 10,
            padding: "10px 14px", border: "1px solid rgba(59,130,246,0.15)",
          }}>
            <FaInfoCircle style={{ fontSize: 14, color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#1d4ed8", lineHeight: 1.5 }}>
              Rate yourself on each KRA honestly. Your manager will review after you submit. Ratings are on a scale of <strong>1 (Poor)</strong> to <strong>5 (Excellent)</strong>.
            </p>
          </div>
        )}

        {/* ── Submitted banner ── */}
        {submitted && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(34,197,94,0.08)", borderRadius: 10,
            padding: "12px 16px", border: "1px solid rgba(34,197,94,0.2)",
          }}>
            <FaCheckCircle style={{ fontSize: 16, color: "#22c55e", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Self appraisal submitted!</p>
              <p style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                Your manager will review your ratings. You'll be notified once feedback is available.
              </p>
            </div>
          </div>
        )}

        {/* ── Manager review locked banner ── */}
        {submitted && !managerReleased && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--row-hover)", borderRadius: 10,
            padding: "10px 14px", border: "1px solid var(--border)",
          }}>
            <FaLock style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              Manager feedback is not yet available. Check back after your manager completes the review.
            </p>
          </div>
        )}

        {/* ── KRA cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              KRAs — {EMPLOYEE.template}
            </p>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Total Weightage: <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                {kras.reduce((s, k) => s + k.weightage, 0)}%
              </span>
            </span>
          </div>

          {kras.map((kra, i) => (
            <KRACard
              key={kra.id}
              kra={kra}
              index={i}
              onUpdate={handleUpdate}
              managerReleased={managerReleased}
            />
          ))}
        </div>

        {/* ── Footer actions ── */}
        {!submitted && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderRadius: 12,
            background: "var(--card)", border: "1px solid var(--border)",
            flexWrap: "wrap", gap: 10,
          }}>
            <div>
              {!allRated && (
                <p style={{ fontSize: 12, color: "var(--muted)" }}>
                  Rate all <strong style={{ color: "var(--text)" }}>{totalCount - ratedCount}</strong> remaining KRA{totalCount - ratedCount > 1 ? "s" : ""} to submit
                </p>
              )}
              {allRated && (
                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                  ✓ All KRAs rated — ready to submit
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: 13, padding: "8px 18px" }}
                onClick={() => setShowModal(true)}
              >
                View Full Form
              </button>
              <button
                className="btn btn-primary"
                disabled={!allRated}
                onClick={handleSubmit}
                style={{
                  fontSize: 13, padding: "8px 22px",
                  display: "flex", alignItems: "center", gap: 7,
                  opacity: allRated ? 1 : 0.5,
                  cursor: allRated ? "pointer" : "not-allowed",
                }}
              >
                <FaPaperPlane style={{ fontSize: 12 }} />
                Submit Self Appraisal
              </button>
            </div>
          </div>
        )}

        {/* After submit — view full form */}
        {submitted && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-outline"
              style={{ fontSize: 13, padding: "8px 18px" }}
              onClick={() => setShowModal(true)}
            >
              View Full Appraisal Form
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AppraisalFormModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          modalId="employee-appraisal-modal"
        />
      )}
    </>
  );
};

export default EmployeeAppraisalView;