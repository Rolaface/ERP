import { useEffect } from "react";

export function useFieldDefault(
  isOpen: boolean,
  currentValue: string | undefined,
  fetcher: (txt?: string) => Promise<{ value: string; label: string }[]>,
  setter: (value: string) => void
): void {
  useEffect(() => {
    if (!isOpen) return;
    if (currentValue?.trim()) return; 

    let cancelled = false;

    fetcher("").then((options) => {
      if (cancelled) return;
      if (options.length > 0) {
        setter(options[0].value);
      }
    }).catch(() => {
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]); 
}