import { useState } from "react";


export function useMaskedRows() {
  const [visibleRows, setVisibleRows] = useState<Record<string, boolean>>({});

  const isVisible = (id: string | number) => !!visibleRows[String(id)];

  const toggle = (id: string | number) =>
    setVisibleRows((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));

  const mask = (val?: string | number | null): string => {
    if (!val) return "—";
    const str = String(val);
    if (str.length <= 4) return "*".repeat(str.length);
    return "*".repeat(str.length - 4) + str.slice(-4);
  };

  const reveal = (id: string | number, val?: string | number | null): string => {
    if (!val) return "—";
    return isVisible(id) ? String(val) : mask(val);
  };

  return { isVisible, toggle, mask, reveal };
}