import { useState } from "react";
import { Columns3, ChevronDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { actionBtnCls } from "./Styles";

interface Props<T> {
  columns: Column<T, unknown>[];
}

export function ColumnToggle<T>({ columns }: Props<T>) {
  const [open, setOpen] = useState(false);
  const hideable = columns.filter((c) => c.getCanHide());

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={actionBtnCls}>
        <Columns3 size={13} />
        Columns
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 flex w-48 flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-card p-3 shadow-lg">
            {hideable.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer select-none items-center gap-2 text-xs text-main"
              >
                <input
                  type="checkbox"
                  checked={c.getIsVisible()}
                  onChange={c.getToggleVisibilityHandler()}
                  className="accent-[var(--primary)]"
                />
                {(c.columnDef.meta as { label?: string } | undefined)?.label ?? c.id}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ColumnToggle;