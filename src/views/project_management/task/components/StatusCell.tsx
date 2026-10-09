import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import StatusBadge from "../../../../components/ui/Table/StatusBadge";
import { ChevronDown } from "lucide-react";
import { fireManagedSwal } from "../../../../utils/swalManager";

type StatusVariant = "draft" | "info" | "success" | "danger";

interface StatusOption {
  label: string;
  value: string;
  variant: StatusVariant;
}

interface StatusCellProps {
  status: string;
  progress?: number;
  options: StatusOption[];
  disabled?: boolean;
  onChange: (nextStatus: string, nextProgress?: number) => void;
}

const clampProgress = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

const StatusCell: React.FC<StatusCellProps> = ({
  status,
  progress,
  options,
  disabled,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [progressDraft, setProgressDraft] = useState<number>(progress ?? 0);
  const [progressEnabled, setProgressEnabled] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find((o) => o.value === status);

  useEffect(() => {
    if (open) {
      setProgressDraft(progress ?? 0);
      setProgressEnabled(false);
    }
  }, [open, progress]);

  const reposition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.max(rect.width, 220);
    const left = Math.min(Math.max(rect.left, 8), vw - width - 8);

    const estimatedHeight = options.length * 36 + 70;
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setPos({ bottom: vh - rect.top + 4, left, width });
    } else {
      setPos({ top: rect.bottom + 4, left, width });
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = async (nextValue: string, nextLabel: string) => {
    const nextProgress: number | undefined =
      nextValue === "Completed"
        ? 100
        : progressEnabled
        ? clampProgress(progressDraft)
        : undefined;

    setOpen(false);

    const nothingChanged =
      nextValue === status && (nextProgress === undefined || nextProgress === (progress ?? 0));
    if (nothingChanged) return;

    const progressText =
      nextProgress !== undefined ? ` and progress to ${nextProgress}%` : "";

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Update task?",
      text: `Set status to "${nextLabel}"${progressText}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      onChange(nextValue, nextProgress);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          reposition();
          setOpen((o) => !o);
        }}
        className={[
          "inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-app/60",
        ].join(" ")}
      >
        <StatusBadge
          status={status as any}
          variant={currentOption?.variant ?? "draft"}
        />
        {!disabled && (
          <ChevronDown
            size={12}
            className={[
              "text-muted transition-transform shrink-0",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              ...(pos.top !== undefined ? { top: pos.top } : {}),
              ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
              left: pos.left,
              width: pos.width,
              zIndex: 99999,
            }}
            className="bg-card border border-theme rounded shadow-lg overflow-hidden"
          >
            <div>
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.label)}
                  className={[
                    "px-3 py-2 text-xs cursor-pointer row-hover",
                    opt.value === status ? "bg-primary/5 font-semibold" : "",
                  ].join(" ")}
                >
                  {opt.label}
                </div>
              ))}
            </div>

            {status !== "Completed" && (
              <div
                className="border-t border-theme px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={progressEnabled}
                    onChange={(e) => setProgressEnabled(e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-[11px] font-semibold text-main">
                    Update progress
                  </span>
                </label>

                {progressEnabled && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Progress
                      </span>
                      <span className="text-[11px] font-bold font-mono text-primary">
                        {progressDraft}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={progressDraft}
                      onChange={(e) =>
                        setProgressDraft(clampProgress(Number(e.target.value)))
                      }
                      className="w-full accent-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSelect(status, currentOption?.label ?? status)
                      }
                      className="mt-2 w-full text-[11px] font-semibold text-primary hover:underline text-left"
                    >
                      Apply progress only
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default StatusCell;