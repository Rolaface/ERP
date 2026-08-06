
import React from "react";

export interface DetailField {
  label: string;
  value: React.ReactNode;

  span?: 1 | 2 | 3 | 4;
}

interface ExpandableDetailRowProps {
  /** must match the number of columns in the parent <table> so the panel spans full width */
  colSpan: number;
  /** key-value pairs to render in the grid */
  fields: DetailField[];
  /** number of grid columns (default 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** extra content rendered below the field grid — e.g. a remark input, action buttons */
  children?: React.ReactNode;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const SPAN_CLASS: Record<number, string> = {
  1: "",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

const ExpandableDetailRow: React.FC<ExpandableDetailRowProps> = ({
  colSpan,
  fields,
  columns = 4,
  children,
  className = "",
}) => {
  return (
    <tr className={`bg-app/30 ${className}`}>
      <td colSpan={colSpan} className="px-8 py-4">
        <div className={`grid ${GRID_COLS[columns]} gap-x-6 gap-y-3 text-[11px]`}>
          {fields.map((f, i) => (
            <div key={i} className={SPAN_CLASS[f.span ?? 1]}>
              <span className="text-muted block">{f.label}</span>
              <span className="text-main">{f.value ?? "—"}</span>
            </div>
          ))}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </td>
    </tr>
  );
};

export default ExpandableDetailRow;