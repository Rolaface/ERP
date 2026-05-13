import React, { useState } from "react";
import { Star, TrendingUp, MessageSquare, Award, ChevronDown, ChevronUp } from "lucide-react";

const DUMMY_APPRAISALS = [
  {
    id: "1",
    cycle: "Annual Appraisal FY 2024-25",
    period: "Apr 2024 – Mar 2025",
    reviewedBy: "Priya Sharma",
    designation: "Engineering Manager",
    status: "Completed",
    overallRating: 4.2,
    ratingLabel: "Exceeds Expectations",
    completedOn: "15 Apr 2025",
    goals: [
      { title: "Deliver Q2 feature roadmap", weight: 30, score: 4.5, comment: "Delivered ahead of schedule with high quality." },
      { title: "Improve test coverage to 80%", weight: 20, score: 4.0, comment: "Coverage reached 82%, good improvement." },
      { title: "Mentor 2 junior developers", weight: 20, score: 4.0, comment: "Active mentorship observed." },
      { title: "Reduce P1 bug turnaround to <24h", weight: 30, score: 4.2, comment: "Consistent response time improvement." },
    ],
    competencies: [
      { name: "Communication",      score: 4 },
      { name: "Problem Solving",    score: 5 },
      { name: "Teamwork",           score: 4 },
      { name: "Initiative",         score: 4 },
      { name: "Technical Skills",   score: 5 },
    ],
    managerFeedback: "Consistently delivers quality work and shows great ownership. Ready for next level responsibilities.",
    selfComment: "I focused on cross-team collaboration and code quality this year.",
  },
  {
    id: "2",
    cycle: "Mid-Year Review FY 2025-26",
    period: "Apr 2025 – Sep 2025",
    reviewedBy: "Priya Sharma",
    designation: "Engineering Manager",
    status: "Completed",
    overallRating: 3.8,
    ratingLabel: "Meets Expectations",
    completedOn: "10 Oct 2025",
    goals: [
      { title: "Lead migration to microservices", weight: 40, score: 3.8, comment: "In progress, good planning shown." },
      { title: "Complete AWS certification", weight: 20, score: 4.0, comment: "Certification achieved in August." },
      { title: "Reduce sprint carry-overs by 25%", weight: 40, score: 3.5, comment: "Improvement seen but room for more." },
    ],
    competencies: [
      { name: "Communication",      score: 4 },
      { name: "Problem Solving",    score: 4 },
      { name: "Teamwork",           score: 4 },
      { name: "Initiative",         score: 3 },
      { name: "Technical Skills",   score: 4 },
    ],
    managerFeedback: "Good progress on key projects. Focus on timely escalation of blockers.",
    selfComment: "Took on more architectural responsibilities this half.",
  },
  {
    id: "3",
    cycle: "Annual Appraisal FY 2025-26",
    period: "Apr 2025 – Mar 2026",
    reviewedBy: "—",
    designation: "—",
    status: "Pending",
    overallRating: null,
    ratingLabel: null,
    completedOn: null,
    goals: [],
    competencies: [],
    managerFeedback: null,
    selfComment: null,
  },
];

const RATING_COLORS: Record<string, string> = {
  "Exceeds Expectations": "text-green-600 bg-green-50 border-green-200",
  "Meets Expectations":   "text-blue-600  bg-blue-50  border-blue-200",
  "Below Expectations":   "text-red-600   bg-red-50   border-red-200",
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        return (
          <span key={i} className="relative inline-block">
            <Star
              size={13}
              className="text-[var(--border)]"
              fill="currentColor"
            />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: partial ? `${(value % 1) * 100}%` : "100%" }}
              >
                <Star size={13} className="text-amber-400" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
      <span className="ml-1 text-xs font-bold text-[var(--text)]">{value}</span>
    </div>
  );
}

function AppraisalCard({ appraisal }: { appraisal: typeof DUMMY_APPRAISALS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = appraisal.status === "Pending";

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl shrink-0"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{appraisal.cycle}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">{appraisal.period}</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              isPending
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {appraisal.status}
          </span>
        </div>

        {/* ── Summary row ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Reviewed By</p>
            <p className="text-sm font-semibold text-[var(--text)]">{appraisal.reviewedBy}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Completed On</p>
            <p className="text-sm font-semibold text-[var(--text)]">{appraisal.completedOn ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Overall Rating</p>
            {appraisal.overallRating !== null
              ? <StarRating value={appraisal.overallRating} />
              : <p className="text-sm font-semibold text-[var(--muted)]">—</p>
            }
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Rating Label</p>
            {appraisal.ratingLabel
              ? (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${RATING_COLORS[appraisal.ratingLabel] ?? ""}`}>
                  {appraisal.ratingLabel}
                </span>
              )
              : <p className="text-sm font-semibold text-[var(--muted)]">—</p>
            }
          </div>
        </div>

        {/* ── Expand toggle (only for completed) ── */}
        {!isPending && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:opacity-75 transition-opacity"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide Details" : "View Details"}
          </button>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {expanded && !isPending && (
        <div className="border-t border-[var(--border)] p-5 space-y-6">

          {/* Goals */}
          {appraisal.goals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "var(--primary)" }} />
                <p className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Goals & Objectives</p>
              </div>
              <div className="space-y-3">
                {appraisal.goals.map((g, i) => (
                  <div key={i} className="bg-[var(--row-hover)] rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <p className="text-sm font-semibold text-[var(--text)]">{g.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Weight: {g.weight}%</span>
                        <StarRating value={g.score} />
                      </div>
                    </div>
                    {g.comment && (
                      <p className="text-xs text-[var(--muted)] mt-1">{g.comment}</p>
                    )}
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(g.score / 5) * 100}%`,
                          background: "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competencies */}
          {appraisal.competencies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} style={{ color: "var(--primary)" }} />
                <p className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Competencies</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {appraisal.competencies.map((c, i) => (
                  <div key={i} className="bg-[var(--row-hover)] rounded-xl p-3">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">{c.name}</p>
                    <StarRating value={c.score} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {(appraisal.managerFeedback || appraisal.selfComment) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} style={{ color: "var(--primary)" }} />
                <p className="text-xs font-black uppercase tracking-wider text-[var(--text)]">Feedback</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appraisal.managerFeedback && (
                  <div className="bg-[var(--row-hover)] rounded-xl p-3.5">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">Manager Feedback</p>
                    <p className="text-sm text-[var(--text)] leading-relaxed">{appraisal.managerFeedback}</p>
                  </div>
                )}
                {appraisal.selfComment && (
                  <div className="bg-[var(--row-hover)] rounded-xl p-3.5">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">Self Comment</p>
                    <p className="text-sm text-[var(--text)] leading-relaxed">{appraisal.selfComment}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function EmployeeAppraisals() {
  return (
    <div className="p-4 space-y-4">
      {DUMMY_APPRAISALS.map((a) => (
        <AppraisalCard key={a.id} appraisal={a} />
      ))}
    </div>
  );
}