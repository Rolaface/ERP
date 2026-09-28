import React from "react";

// Compact label + value field — exactly the `F` component from InvoiceDetailModal
export const DrawerField: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p
      style={{
        fontSize: 9,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 700,
        marginBottom: 1,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 13,
        color: value ? "var(--text)" : "var(--muted)",
        fontWeight: 500,
        fontFamily: mono ? "monospace" : undefined,
        lineHeight: 1.3,
      }}
    >
      {value || "—"}
    </p>
  </div>
);

// Section divider with inline title — exactly the `S` component
export const DrawerSection: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 7px" }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// Top summary card row — generalized version of the Grand Total / Invoice Date / Due Date cards
export const DrawerSummaryCards: React.FC<{
  items: { label: string; value: React.ReactNode; emphasis?: boolean }[];
}> = ({ items }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 6,
      marginBottom: 2,
    }}
  >
    {items.map((it, i) => (
      <div
        key={i}
        style={{
          padding: "9px 11px",
          borderRadius: 7,
          background: it.emphasis ? "var(--primary)" : "var(--bg)",
          border: it.emphasis ? "none" : "1px solid var(--border)",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: it.emphasis ? "rgba(255,255,255,0.7)" : "var(--muted)",
            marginBottom: 2,
          }}
        >
          {it.label}
        </p>
        <p
          style={{
            fontSize: it.emphasis ? 16 : 13,
            fontWeight: it.emphasis ? 800 : 700,
            color: it.emphasis ? "#fff" : "var(--text)",
            letterSpacing: it.emphasis ? "-0.02em" : undefined,
          }}
        >
          {it.value}
        </p>
      </div>
    ))}
  </div>
);