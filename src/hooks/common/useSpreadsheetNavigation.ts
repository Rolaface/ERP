import { useCallback, useEffect } from "react";

const FOCUSABLE_SELECTOR =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useSpreadsheetNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  // ── Highlight the active row/column so the user always knows where they are ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const clearHighlight = () => {
      container
        .querySelectorAll('[data-active-row="true"]')
        .forEach((el) => el.removeAttribute("data-active-row"));
      container
        .querySelectorAll('[data-active-col="true"]')
        .forEach((el) => el.removeAttribute("data-active-col"));
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest<HTMLElement>("[data-row][data-col]");
      if (!cell) return;

      const row = cell.getAttribute("data-row");
      const col = cell.getAttribute("data-col");

      clearHighlight();

      container
        .querySelectorAll(`[data-row="${row}"]`)
        .forEach((el) => el.setAttribute("data-active-row", "true"));
      container
        .querySelectorAll(`[data-header-col="${col}"], [data-col="${col}"]`)
        .forEach((el) => el.setAttribute("data-active-col", "true"));
    };

    const onFocusOut = (e: FocusEvent) => {
      // If focus is leaving the whole grid (not just moving to another cell), clear.
      const next = e.relatedTarget as Node | null;
      if (!next || !container.contains(next)) clearHighlight();
    };

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    return () => {
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
    };
  }, [containerRef]);

  const focusCell = useCallback(
    (row: number, col: number, axis: "row" | "col", step: number) => {
      const container = containerRef.current;
      if (!container) return;

      let r = row;
      let c = col;

      for (let attempts = 0; attempts < 50; attempts++) {
        if (axis === "row") r += step;
        else c += step;

        const cell = container.querySelector<HTMLElement>(
          `[data-row="${r}"][data-col="${c}"]`,
        );
        if (!cell) return; // grid boundary reached

        const focusable = cell.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable) {
          focusable.focus();
          if (focusable instanceof HTMLInputElement) focusable.select?.();
          return;
        }
        // empty cell (Amount/Actions column), keep scanning same direction
      }
    },
    [containerRef],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // If a dropdown/suggestion list is open inside this cell, let it handle its own keys.
      if (target.closest('[data-nav-ignore="true"]')) return;

      const cell = target.closest<HTMLElement>("[data-row][data-col]");
      if (!cell) return;

      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      if (Number.isNaN(row) || Number.isNaN(col)) return;

      const input = target as HTMLInputElement;
      const atStart = !("selectionStart" in target) || input.selectionStart === 0;
      const atEnd =
        !("selectionStart" in target) || input.selectionStart === input.value?.length;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          focusCell(row, col, "row", -1);
          break;
        case "ArrowDown":
        case "Enter":
          e.preventDefault();
          focusCell(row, col, "row", 1);
          break;
        case "ArrowLeft":
          if (atStart) {
            e.preventDefault();
            focusCell(row, col, "col", -1);
          }
          break;
        case "ArrowRight":
          if (atEnd) {
            e.preventDefault();
            focusCell(row, col, "col", 1);
          }
          break;
      }
    },
    [focusCell],
  );

  return onKeyDown;
}