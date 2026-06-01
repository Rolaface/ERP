import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DateRangeFilterProps {
  from?: string;
  to?: string;
  onChange: (range: { from_date?: string; to_date?: string }) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function calDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = Array(first).fill(null);
  for (let i = 1; i <= total; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
function fmt(s?: string) {
  if (!s) return "";
  const [y,m,d] = s.split("-");
  return `${d} ${MONTHS[+m-1].slice(0,3)} ${y}`;
}

// ─── Quick-select presets ─────────────────────────────────────────────────────

const PRESETS = [
  { label: "Today",        days: 0  },
  { label: "Last 7 days",  days: 7  },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function getPresetRange(days: number) {
  const to   = new Date();
  const from = days === 0 ? new Date() : new Date(Date.now() - days * 86_400_000);
  return { from_date: toYMD(from), to_date: toYMD(to) };
}

// ─── Single-month calendar ────────────────────────────────────────────────────

interface MonthCalProps {
  year:    number;
  month:   number;
  from?:   string;
  to?:     string;
  hover?:  string;
  onDay:   (ymd: string) => void;
  onHover: (ymd: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const MonthCal: React.FC<MonthCalProps> = ({
  year, month, from, to, hover, onDay, onHover, onPrev, onNext,
}) => {
  const cells = calDays(year, month);
  const rangeEnd = hover && (!to || (from && hover > from)) ? hover : to;

  return (
    <div style={{ minWidth: 200, flex: 1 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        {onPrev
          ? <button onClick={onPrev} style={navBtn}>‹</button>
          : <span style={{ width:28 }} />}
        <span style={{ fontSize:13, fontWeight:700, color:"var(--text-main, #1a1a2e)" }}>
          {MONTHS[month]} {year}
        </span>
        {onNext
          ? <button onClick={onNext} style={navBtn}>›</button>
          : <span style={{ width:28 }} />}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:"#94a3b8", padding:"2px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const ymd = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isFrom     = ymd === from;
          const isTo       = ymd === (to || (hover && from ? hover : undefined));
          const inRange    = from && rangeEnd && ymd > from && ymd < rangeEnd;
          const isToday    = ymd === toYMD(new Date());
          const isEndpoint = isFrom || isTo;

          return (
            <button
              key={i}
              onClick={() => onDay(ymd)}
              onMouseEnter={() => onHover(ymd)}
              style={{
                border: "none",
                borderRadius: isEndpoint ? 8 : inRange ? 0 : 6,
                padding: "5px 0",
                fontSize: 12,
                fontWeight: isEndpoint ? 700 : 400,
                cursor: "pointer",
                background: isEndpoint
                  ? "var(--color-primary, #2563eb)"
                  : inRange
                    ? "rgba(37,99,235,0.10)"
                    : "transparent",
                color: isEndpoint
                  ? "#fff"
                  : isToday
                    ? "var(--color-primary, #2563eb)"
                    : "var(--text-main, #1a1a2e)",
                outline: isToday && !isEndpoint ? "1.5px solid rgba(37,99,235,0.4)" : "none",
                transition: "all .12s",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 28, height: 28,
  border: "1.5px solid var(--border, #e2e8f0)",
  borderRadius: 7,
  background: "var(--bg-card, #fff)",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 16,
  color: "var(--text-main, #1a1a2e)",
  lineHeight: 1,
};

// ─── Main component ───────────────────────────────────────────────────────────

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ from, to, onChange }) => {
  const today = new Date();
  const [open, setOpen]   = useState(false);
  const [hover, setHover] = useState<string>("");
  const [leftY, setLeftY] = useState(today.getFullYear());
  const [leftM, setLeftM] = useState(today.getMonth());
  const [draft, setDraft] = useState<{ from?: string; to?: string }>({ from, to });

  // Portal positioning
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);

  const rightM = (leftM + 1) % 12;
  const rightY = leftM === 11 ? leftY + 1 : leftY;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdown = document.getElementById("date-range-portal");
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdown && !dropdown.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalculate position on open / scroll / resize
  useEffect(() => {
    if (!open) return;

    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 540;
      setIsMobile(mobile);

      const dropW = mobile ? Math.min(window.innerWidth - 16, 340) : Math.min(560, window.innerWidth - 32);
      let left = rect.left + window.scrollX;

      // Clamp so it doesn't go off-screen to the right
      if (left + dropW > window.innerWidth + window.scrollX - 8) {
        left = window.innerWidth + window.scrollX - dropW - 8;
      }
      // Clamp left edge
      left = Math.max(left, 8);

      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left,
        width: dropW,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const handleDay = (ymd: string) => {
    if (!draft.from || (draft.from && draft.to)) {
      setDraft({ from: ymd, to: undefined });
    } else {
      if (ymd < draft.from) setDraft({ from: ymd, to: draft.from });
      else setDraft({ from: draft.from, to: ymd });
    }
  };

  const applyDraft = () => {
    onChange({ from_date: draft.from, to_date: draft.to });
    setOpen(false);
  };

  const clearAll = () => {
    setDraft({});
    onChange({ from_date: undefined, to_date: undefined });
    setOpen(false);
  };

  const applyPreset = (days: number) => {
    const range = getPresetRange(days);
    setDraft({ from: range.from_date, to: range.to_date });
    onChange(range);
    setOpen(false);
  };

  const hasValue = from || to;
  const label = hasValue
    ? from && to ? `${fmt(from)} – ${fmt(to)}` : fmt(from || to)
    : "Date Range";

  // ─── Dropdown portal content ────────────────────────────────────────────────

  const dropdown = open && dropdownPos ? createPortal(
    <div
      id="date-range-portal"
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
        background: "var(--bg-card, #fff)",
        border: "1.5px solid var(--border, #e2e8f0)",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
        overflow: "hidden",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* Presets sidebar / top bar */}
      <div style={{
        padding: isMobile ? "10px 12px" : "16px 12px",
        borderRight: isMobile ? "none" : "1.5px solid var(--border, #e2e8f0)",
        borderBottom: isMobile ? "1.5px solid var(--border, #e2e8f0)" : "none",
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? 6 : 4,
        minWidth: isMobile ? "unset" : 120,
        background: "var(--bg-app, #f8fafc)",
        alignItems: isMobile ? "center" : "stretch",
      }}>
        {!isMobile && (
          <p style={{
            fontSize: 10, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: 1,
            marginBottom: 4, paddingLeft: 4,
          }}>Quick pick</p>
        )}
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            style={{
              padding: isMobile ? "5px 10px" : "7px 10px",
              borderRadius: 8,
              border: isMobile ? "1.5px solid var(--border, #e2e8f0)" : "none",
              background: "transparent",
              color: "var(--text-main, #1a1a2e)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              transition: "background .12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(37,99,235,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar area */}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
        {/* From / To chips */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 28, flexWrap: "wrap" }}>
          <Chip label="From" value={fmt(draft.from)} />
          {(draft.from || draft.to) && <span style={{ color: "#94a3b8", fontSize: 12 }}>→</span>}
          <Chip label="To" value={fmt(draft.to)} />
        </div>

        {/* Months — dual on desktop, single on mobile */}
        <div style={{ display: "flex", gap: 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <MonthCal
            year={leftY} month={leftM}
            from={draft.from} to={draft.to} hover={hover}
            onDay={handleDay} onHover={setHover}
            onPrev={() => {
              if (leftM === 0) { setLeftM(11); setLeftY(y => y - 1); }
              else setLeftM(m => m - 1);
            }}
            onNext={isMobile ? () => {
              if (leftM === 11) { setLeftM(0); setLeftY(y => y + 1); }
              else setLeftM(m => m + 1);
            } : undefined}
          />
          {!isMobile && (
            <MonthCal
              year={rightY} month={rightM}
              from={draft.from} to={draft.to} hover={hover}
              onDay={handleDay} onHover={setHover}
              onNext={() => {
                if (leftM === 11) { setLeftM(0); setLeftY(y => y + 1); }
                else setLeftM(m => m + 1);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          borderTop: "1.5px solid var(--border,#e2e8f0)", paddingTop: 12,
        }}>
          <button onClick={clearAll} style={footerBtn("ghost")}>Clear</button>
          <button
            onClick={applyDraft}
            disabled={!draft.from}
            style={footerBtn("primary", !draft.from)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={triggerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setDraft({ from, to }); setOpen(o => !o); }}
        style={{
          height: 32,
          padding: "0 10px",
          borderRadius: 8,
          border: `1.5px solid ${hasValue ? "var(--color-primary,#2563eb)" : "var(--border,#e2e8f0)"}`,
          background: hasValue ? "rgba(37,99,235,0.06)" : "var(--bg-card,#fff)",
          color: hasValue ? "var(--color-primary,#2563eb)" : "var(--text-muted,#64748b)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          transition: "all .15s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {label}
        {hasValue && (
          <span
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
            style={{ marginLeft: 2, opacity: .6, fontSize: 14, lineHeight: 1, cursor: "pointer" }}
          >×</span>
        )}
      </button>

      {dropdown}
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const Chip: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 8,
    border: "1.5px solid var(--border,#e2e8f0)",
    background: "var(--bg-app,#f8fafc)",
    fontSize: 11, minWidth: 100,
  }}>
    <span style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</span>
    <span style={{ color: "var(--text-main,#1a1a2e)", fontWeight: 600 }}>
      {value || <span style={{ color: "#cbd5e1" }}>—</span>}
    </span>
  </div>
);

function footerBtn(variant: "ghost" | "primary", disabled?: boolean): React.CSSProperties {
  return {
    padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    border: variant === "primary" ? "none" : "1.5px solid var(--border,#e2e8f0)",
    background: variant === "primary"
      ? disabled ? "#94a3b8" : "var(--color-primary,#2563eb)"
      : "transparent",
    color: variant === "primary" ? "#fff" : "var(--text-main,#1a1a2e)",
    opacity: disabled ? 0.6 : 1,
    transition: "all .15s",
  };
}

export default DateRangeFilter;