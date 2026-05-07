import type { Column } from "./type";

interface ModalTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: (row: T) => string;
}

const ModalTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found",
  rowKey,
}: ModalTableProps<T>) => {
  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-card overflow-hidden">
      {/* HEADER */}
      <div className="overflow-x-auto border-b border-[var(--border)]">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-left bg-[var(--table-head)] text-[var(--table-head-text)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* BODY */}
      <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-center text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-center text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row) : idx}
                  className={`border-b border-[var(--border)] transition-colors ${
                    idx % 2 === 0
                      ? "bg-transparent"
                      : "bg-[var(--row-hover)]/20"
                  } hover:bg-[var(--row-hover)]`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-4 py-2 text-sm text-main truncate ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row) : (row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModalTable;
