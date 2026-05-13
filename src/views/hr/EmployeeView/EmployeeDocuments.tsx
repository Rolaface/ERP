import React, { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";

const DUMMY_DOCS = [
  { id: "1", name: "Offer Letter",            type: "PDF", date: "01 Mar 2024", size: "245 KB",  category: "Employment" },
  { id: "2", name: "Employment Contract",      type: "PDF", date: "01 Mar 2024", size: "512 KB",  category: "Employment" },
  { id: "3", name: "Appointment Letter",       type: "PDF", date: "01 Mar 2024", size: "198 KB",  category: "Employment" },
  { id: "4", name: "Increment Letter FY 2025", type: "PDF", date: "01 Apr 2025", size: "156 KB",  category: "Compensation" },
  { id: "5", name: "PF UAN Card",              type: "PDF", date: "15 Jun 2024", size: "89 KB",   category: "Statutory" },
  { id: "6", name: "ESI Card",                 type: "PDF", date: "15 Jun 2024", size: "76 KB",   category: "Statutory" },
  { id: "7", name: "ID Card",                  type: "Image",date: "01 Mar 2024", size: "320 KB", category: "Identity" },
];

const CATEGORIES = ["All", "Employment", "Compensation", "Statutory", "Identity"];

const EmployeeDocuments: React.FC = () => {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All"
    ? DUMMY_DOCS
    : DUMMY_DOCS.filter((d) => d.category === filter);

  return (
    <div className="p-4 space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === cat
                ? "text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={filter === cat ? { background: "var(--primary)" } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {filtered.map((doc, i) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between px-5 py-4 hover:bg-[var(--row-hover)] transition-colors ${
              i > 0 ? "border-t border-[var(--border)]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  color:       "var(--primary)",
                }}
              >
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{doc.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {doc.type} · {doc.size} · {doc.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                  color:       "var(--primary)",
                }}
              >
                {doc.category}
              </span>
              <button className="p-2 rounded-lg hover:bg-[var(--row-hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                <Eye size={15} />
              </button>
              <button className="p-2 rounded-lg hover:bg-[var(--row-hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                <Download size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDocuments;