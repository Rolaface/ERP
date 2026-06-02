import React, { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";

const Skeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`animate-pulse rounded-xl bg-[var(--muted)]/40 ${className}`}
  />
);

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}

interface AttendanceTimerProps {
  inTime: string | null;
  totalWorkedSeconds: number;
  isActive: boolean;
  loading: boolean;
}

const AttendanceTimer: React.FC<AttendanceTimerProps> = ({
  inTime,
  totalWorkedSeconds,
  isActive,
  loading,
}) => {
  const [elapsed, setElapsed] = useState<number>(
    totalWorkedSeconds ?? 0,
  );

  const [isRunning, setIsRunning] = useState<boolean>(
    Boolean(isActive),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const baseSeconds =
      typeof totalWorkedSeconds === "number"
        ? totalWorkedSeconds
        : 0;

    setElapsed(baseSeconds);

    if (!isActive || !inTime) {
      setIsRunning(false);
      return;
    }

    const startMs = Date.parse(
      inTime.replace(" ", "T"),
    );

    if (Number.isNaN(startMs)) {
      setIsRunning(false);
      return;
    }

    const tick = () => {
      const liveSeconds = Math.max(
        0,
        Math.floor((Date.now() - startMs) / 1000),
      );

      setElapsed(baseSeconds + liveSeconds);
    };

    tick();

    setIsRunning(true);

    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [inTime, totalWorkedSeconds, isActive]);

  return (
    <div className="rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/6 p-3 text-left flex-1 min-w-0 h-[75px]">
      {loading ? (
        <Skeleton className="h-full w-full min-h-[60px]" />
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Timer
              size={13}
              className="text-[var(--primary)]"
            />

            {isRunning && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          <p className="text-base font-bold leading-tight text-[var(--primary)] font-mono tracking-tight">
            {formatElapsed(elapsed)}
          </p>

          <p className="text-[10px] text-[var(--muted-foreground)]">
            Hours Worked
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTimer;