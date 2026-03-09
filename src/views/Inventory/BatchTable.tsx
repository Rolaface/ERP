import React from "react";
import { Package2 } from "lucide-react";

interface Batch {
  batch_no?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  bal_qty?: number;
  in_qty?: number;
  out_qty?: number;
  buy_value?: number;
  sell_value?: number;
}

interface Props {
  batches: Batch[];
}

const BatchTable: React.FC<Props> = ({ batches }) => {
  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return diff > 0 && diff <= 90;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "-") return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const totalQty  = batches.reduce((s, b) => s + (b.bal_qty ?? 0), 0);
  const totalBuy  = batches.reduce((s, b) => s + Number(b.buy_value  || 0), 0);
  const totalSell = batches.reduce((s, b) => s + Number(b.sell_value || 0), 0);

  return (
    // Outer wrapper: warm tinted bg + left accent border + top/bottom shadow to "lift" it
    <div
      className="w-full"
      style={{
        background: "linear-gradient(to right, #fdf8f2, #fefcf9)",
        borderLeft: "3px solid var(--primary, #c97d2e)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04), inset 0 -2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* ── Sub-header ── */}
      <div
        className="flex items-center gap-2.5 px-6 py-2.5"
        style={{ borderBottom: "1px solid rgba(201,125,46,0.15)" }}
      >
        <div
          className="flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "rgba(201,125,46,0.12)" }}
        >
          <Package2 size={11} style={{ color: "var(--primary, #c97d2e)" }} />
        </div>
        <span
          className="text-[10px] font-black tracking-widest uppercase"
          style={{ color: "var(--primary, #c97d2e)" }}
        >
          Batch Details
        </span>
        <span
          className="text-[10px] font-semibold rounded-full px-2 py-0.5"
          style={{
            background: "rgba(201,125,46,0.1)",
            color: "var(--primary, #c97d2e)",
          }}
        >
          {batches.length} {batches.length === 1 ? "batch" : "batches"}
        </span>
      </div>

      {batches.length === 0 ? (
        <div className="px-8 py-5 text-xs text-muted opacity-50">
          No batch data available.
        </div>
      ) : (
        <table className="w-full text-sm">

          {/* ── Column headers ── */}
          <thead>
            <tr
              className="text-[10px] font-black uppercase tracking-[0.1em]"
              style={{
                color: "var(--muted, #999)",
                background: "rgba(201,125,46,0.05)",
                borderBottom: "1px solid rgba(201,125,46,0.12)",
              }}
            >
              <th className="w-14 pl-9 pr-2 py-2.5 text-center">#</th>
              <th className="px-5 py-2.5 text-left">Batch No</th>
              <th className="px-5 py-2.5 text-left">MFG Date</th>
              <th className="px-5 py-2.5 text-left">EXP Date</th>
              <th className="px-5 py-2.5 text-right">Qty</th>
              <th className="px-5 py-2.5 text-right">in_qty</th>
              <th className="px-5 py-2.5 text-right">out_qty</th>
              <th className="px-5 py-2.5 text-right">Buy Value</th>
              <th className="px-8 py-2.5 text-right">Sell Value</th>
            </tr>
          </thead>

          {/* ── Batch rows ── */}
          <tbody>
            {batches.map((b, idx) => {
              const expired  = isExpired(b.expiry_date);
              const expiring = isExpiringSoon(b.expiry_date);
              const isLast   = idx === batches.length - 1;

              return (
                <tr
                  key={idx}
                  className="transition-colors"
                  style={{
                    background: idx % 2 === 0
                      ? "rgba(253,248,242,0.6)"
                      : "rgba(255,255,255,0.7)",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid rgba(201,125,46,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(201,125,46,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      idx % 2 === 0
                        ? "rgba(253,248,242,0.6)"
                        : "rgba(255,255,255,0.7)";
                  }}
                >
                  {/* # */}
                  <td className="pl-9 pr-2 py-3 text-center text-[10px] font-semibold tabular-nums"
                    style={{ color: "rgba(201,125,46,0.35)" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </td>

                  {/* Batch No */}
                  <td className="px-5 py-3">
                    <span
                      className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
                      style={{
                        background: "rgba(201,125,46,0.08)",
                        color: "var(--main, #2d2d2d)",
                        border: "1px solid rgba(201,125,46,0.18)",
                      }}
                    >
                      {b.batch_no || "—"}
                    </span>
                  </td>

                  {/* MFG Date */}
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--muted, #888)" }}>
                    {formatDate(b.manufacturing_date)}
                  </td>

                  {/* EXP Date */}
                  <td className="px-5 py-3">
                    {b.expiry_date ? (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
                          expired
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : expiring
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          expired ? "bg-red-500" : expiring ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        {formatDate(b.expiry_date)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "rgba(0,0,0,0.2)" }}>—</span>
                    )}
                  </td>

                  {/* Qty */}
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-xs tabular-nums" style={{ color: "var(--main, #2d2d2d)" }}>
                      {(b.bal_qty ?? 0).toLocaleString("en-IN")}
                    </span>
                  </td>
                  {/* in_qty */}
                  <td className="px-5 py-3 text-right text-xs tabular-nums" style={{ color: "var(--muted, #888)" }}>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.3)" }}> </span>
                   {b.in_qty ? `+${b.in_qty.toLocaleString("en-IN", { maximumFractionDigits: 4 })}` : "0"}
                  </td>
                  {/* out_qty */}
                  <td className="px-5 py-3 text-right text-xs tabular-nums" style={{ color: "var(--muted, #888)" }}>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.3)" }}> </span>
                    {b.out_qty ? `-${b.out_qty.toLocaleString("en-IN", { maximumFractionDigits: 4 })}` : "0"}
                  </td>

                  {/* Buy Value */}
                  <td className="px-5 py-3 text-right text-xs tabular-nums" style={{ color: "var(--muted, #888)" }}>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.3)" }}> </span>
                    {Number(b.buy_value || 0).toLocaleString("en-IN")}
                  </td>

                  {/* Sell Value */}
                  <td className="px-8 py-3 text-right text-xs font-semibold tabular-nums"
                    style={{ color: "var(--primary, #c97d2e)" }}>
                    <span className="text-[10px]" style={{ color: "rgba(201,125,46,0.4)" }}> </span>
                    {Number(b.sell_value || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Totals footer (multi-batch only) ── */}
          {batches.length > 1 && (
            <tfoot>
              <tr
                className="text-xs font-black"
                style={{
                  borderTop: "2px solid rgba(201,125,46,0.2)",
                  background: "rgba(201,125,46,0.07)",
                }}
              >
                <td className="pl-9 pr-2 py-2.5" />
                <td colSpan={3} className="px-5 py-2.5 text-[10px] uppercase tracking-widest"
                  style={{ color: "rgba(201,125,46,0.6)" }}>
                  Total
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: "var(--main, #2d2d2d)" }}>
                  {totalQty.toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: "var(--muted, #888)" }}>
                  <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.3)" }}></span>
                  {totalBuy.toLocaleString("en-IN")}
                </td>
                <td className="px-8 py-2.5 text-right tabular-nums font-black"
                  style={{ color: "var(--primary, #c97d2e)" }}>
                  <span className="text-[10px]" style={{ color: "rgba(201,125,46,0.4)" }}></span>
                  {totalSell.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          )}

        </table>
      )}
    </div>
  );
};

export default BatchTable;