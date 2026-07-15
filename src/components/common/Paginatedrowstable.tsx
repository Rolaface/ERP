import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export interface PaginatedRowsTableProps<T extends { id: string }> {
  /** Column header labels, left to right. Use "" for a trailing actions column. */
  columns: string[];
  /** CSS grid-template-columns string shared by header + every row. */
  gridTemplate: string;
  /** Full (unpaginated) row data. */
  rows: T[];
  /** Renders the cells for a single row (no wrapping div needed — the row div is provided). */
  renderRow: (row: T, absoluteIndex: number) => React.ReactNode;
  /** Called when "Add Row" is clicked. */
  onAddRow: () => void;
  /** Label for the add button. Defaults to "Add Row". */
  addLabel?: string;
  /** Rows per page. Defaults to 5. */
  pageSize?: number;
  /** Max scroll height (px) for the row body before it scrolls internally. Optional. */
  maxBodyHeight?: number;
  /** Disable the Add Row button (e.g. while saving). */
  addDisabled?: boolean;
  /** "bold" (dark, larger — default) or "subtle" (small gray uppercase, the original look). */
  headerVariant?: "bold" | "subtle";
  /** "link" (full-width centered text), "button" (small bordered outline — the original look), or "solid" (filled primary pill, left-aligned — matches "+ Add Item" style). Defaults to "link". */
  addRowVariant?: "link" | "button" | "solid";
  /** Always show the "Showing X to Y of Z" + Prev/Next footer, even for a single page. Defaults to false. */
  alwaysShowPagination?: boolean;
}

function PaginatedRowsTable<T extends { id: string }>({
  columns,
  gridTemplate,
  rows,
  renderRow,
  onAddRow,
  addLabel = "Add Row",
  pageSize = 5,
  maxBodyHeight,
  addDisabled = false,
  headerVariant = "bold",
  addRowVariant = "link",
  alwaysShowPagination = false,
}: PaginatedRowsTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  // Keep page in range whenever rows shrink/grow (e.g. after delete, or after
  // adding a row that pushes onto a new page).
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, rows.length);
  const visibleRows = rows.slice(startIdx, endIdx);
  const showPagination = rows.length > 0 && (alwaysShowPagination || totalPages > 1);

  const handleAddRow = () => {
    onAddRow();
    // Jump to the last page so the newly-added row is visible.
    const nextTotalPages = Math.max(1, Math.ceil((rows.length + 1) / pageSize));
    setPage(nextTotalPages);
  };

  const paginationFooter = showPagination && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-sub, #9ca3af)" }}>
        Showing {startIdx + 1} to {endIdx} of {rows.length} items
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={paginationBtnStyle(page <= 1)}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={paginationBtnStyle(page >= totalPages)}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        className="scm-row"
        style={{
          gridTemplateColumns: gridTemplate,
          background: "var(--bg-hover, rgba(0,0,0,0.02))",
          borderBottom: "1px solid var(--border, #e5e7eb)",
          minHeight: headerVariant === "bold" ? 40 : 28,
        }}
      >
        {columns.map((label, i) => (
          <div
            key={i}
            className={["scm-cell", i < columns.length - 1 ? "scm-cell-border" : ""].filter(Boolean).join(" ")}
            style={
              label && headerVariant === "bold"
                ? { fontSize: 12, fontWeight: 700, color: "var(--text-main)" }
                : undefined
            }
          >
            <span className={label && headerVariant === "subtle" ? "scm-col-header" : undefined}>{label}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="scm-table-wrap" style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}>
        {visibleRows.length === 0 ? (
          <div
            style={{
              padding: "18px 10px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-sub, #9ca3af)",
            }}
          >
            No rows yet.
          </div>
        ) : (
          visibleRows.map((row, i) => (
            <div
              key={row.id}
              className="scm-row"
              style={{ gridTemplateColumns: gridTemplate, minHeight: headerVariant === "bold" ? 44 : undefined }}
            >
              {renderRow(row, startIdx + i)}
            </div>
          ))
        )}
      </div>

      {/* Footer — Add Row + (optional) pagination */}
      {addRowVariant === "link" ? (
        <div style={{ borderTop: "1px solid var(--border, #e5e7eb)" }}>
          <button
            type="button"
            onClick={handleAddRow}
            disabled={addDisabled}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              border: "none",
              background: "var(--bg-app, #fff)",
              padding: "10px",
              fontSize: 12,
              fontWeight: 600,
              color: addDisabled ? "var(--text-sub, #9ca3af)" : "var(--primary,#1c3f6e)",
              cursor: addDisabled ? "not-allowed" : "pointer",
              opacity: addDisabled ? 0.5 : 1,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (addDisabled) return;
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover, rgba(0,0,0,0.02))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-app, #fff)";
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            {addLabel}
          </button>

          {showPagination && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                padding: "6px 10px",
                borderTop: "1px solid var(--border, #e5e7eb)",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text-sub, #9ca3af)" }}>
                Showing {startIdx + 1} to {endIdx} of {rows.length} items
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={paginationBtnStyle(page <= 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={paginationBtnStyle(page >= totalPages)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : addRowVariant === "solid" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px",
            borderTop: "1px solid var(--border, #e5e7eb)",
            background: "var(--bg-app, #fff)",
          }}
        >
          <button
            type="button"
            onClick={handleAddRow}
            disabled={addDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              alignSelf: "flex-start",
              border: "none",
              borderRadius: 8,
              background: "var(--primary,#1c3f6e)",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              cursor: addDisabled ? "not-allowed" : "pointer",
              opacity: addDisabled ? 0.5 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            {addLabel}
          </button>

          {paginationFooter}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "6px 10px",
            borderTop: "1px solid var(--border, #e5e7eb)",
            background: "var(--bg-app, #fff)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleAddRow}
            disabled={addDisabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 6,
              background: "var(--bg-app, #fff)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-main)",
              cursor: addDisabled ? "not-allowed" : "pointer",
              opacity: addDisabled ? 0.5 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <Plus style={{ width: 11, height: 11 }} />
            {addLabel}
          </button>

          {showPagination && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-sub, #9ca3af)" }}>
                Showing {startIdx + 1} to {endIdx} of {rows.length} items
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={paginationBtnStyle(page <= 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={paginationBtnStyle(page >= totalPages)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const paginationBtnStyle = (disabled: boolean): React.CSSProperties => ({
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 6,
  background: "var(--bg-app, #fff)",
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
  color: disabled ? "var(--text-sub, #9ca3af)" : "var(--text-main)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

export default PaginatedRowsTable;