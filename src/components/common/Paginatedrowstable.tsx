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

  const handleAddRow = () => {
    onAddRow();
    // Jump to the last page so the newly-added row is visible.
    const nextTotalPages = Math.max(1, Math.ceil((rows.length + 1) / pageSize));
    setPage(nextTotalPages);
  };

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
          background: "rgba(0,0,0,0.02)",
          borderBottom: "1px solid var(--border, #e5e7eb)",
          minHeight: 28,
        }}
      >
        {columns.map((label, i) => (
          <div
            key={i}
            className={[
              "scm-cell",
              i < columns.length - 1 ? "scm-cell-border" : "",
              label ? "scm-col-header" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div
        className="scm-table-wrap"
        style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
      >
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
            <div key={row.id} className="scm-row" style={{ gridTemplateColumns: gridTemplate }}>
              {renderRow(row, startIdx + i)}
            </div>
          ))
        )}
      </div>

      {/* Footer — Add Row (left) + pagination (right), same spot every time */}
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

        {rows.length > 0 && (
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