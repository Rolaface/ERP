import { useState } from "react";
import { FaDatabase, FaChevronDown, FaSyncAlt, FaEllipsisH } from "react-icons/fa";
import TemplateSection from "./sections/TemplateSection";
import KRASection from "./sections/KRASection";
import FeedbackSection from "./sections/FeedbackSection";

type SetupSection = "template" | "kra" | "feedback";

const SECTIONS = [
  { id: "template" as SetupSection, label: "Appraisal Template"        },
  { id: "kra"      as SetupSection, label: "KRA"                       },
  { id: "feedback" as SetupSection, label: "Employee Feedback Criteria" },
];

export default function SetupPage() {
  const [activeSection, setActiveSection] = useState<SetupSection>("template");

  const section = SECTIONS.find((s) => s.id === activeSection)!;

  const renderSection = () => {
    switch (activeSection) {
      case "template": return <TemplateSection />;
      case "kra":      return <KRASection />;
      case "feedback": return <FeedbackSection />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "12px 0", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FaDatabase style={{ fontSize: 13, color: "var(--muted)" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>Setup</span>
          </div>
          <FaChevronDown style={{ fontSize: 11, color: "var(--muted)" }} />
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 20px",
              background: activeSection === s.id ? "var(--primary-soft, rgba(99,102,241,0.08))" : "none",
              border: "none",
              borderLeft: activeSection === s.id ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeSection === s.id ? "var(--primary)" : "var(--text)",
              fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
            <span>Performance</span>
            <span>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{section.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-outline" style={{ fontSize: 13, padding: "5px 8px" }}>
              <FaSyncAlt style={{ fontSize: 12 }} />
            </button>
            <button className="btn btn-outline" style={{ fontSize: 13, padding: "5px 8px" }}>
              <FaEllipsisH style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>

        {/* Active section */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: 16 }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}