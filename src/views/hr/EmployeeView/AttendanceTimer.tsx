import React, { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";

// ── HELPERS ───────────────────────────────────────────────────────────────────

function workingMinutes(inTime: string | null, outTime: string | null): number {
  if (!inTime || !outTime) return 0;
  const diff =
    new Date(outTime.replace(" ", "T")).getTime() -
    new Date(inTime.replace(" ", "T")).getTime();
  return Math.max(0, Math.floor(diff / 60_000));
}

function formatDuration(mins: number): string {
  if (mins === 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}


interface SessionEntry {
  inTime: string;
  outTime: string;
}

interface StoredAcc {
  accSecs: number;         // canonical accumulated seconds (sum of all sessions)
  sessions: SessionEntry[]; // completed sessions already counted
}

function accKey(employeeId: string, date: string): string {
  return `att_acc_${employeeId}_${date}`;
}

function loadAcc(employeeId: string, date: string): StoredAcc {
  try {
    const raw = sessionStorage.getItem(accKey(employeeId, date));
    if (!raw) return { accSecs: 0, sessions: [] };
    const parsed = JSON.parse(raw) as Partial<StoredAcc>;
    // backward-compat: old shape had { accSecs, lastInTime }
    return {
      accSecs: parsed.accSecs ?? 0,
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return { accSecs: 0, sessions: [] };
  }
}

function saveAcc(employeeId: string, date: string, value: StoredAcc): void {
  try {
    sessionStorage.setItem(accKey(employeeId, date), JSON.stringify(value));
  } catch {
    // non-fatal
  }
}

/** Sum seconds for a completed session. */
function sessionSecs(s: SessionEntry): number {
  return Math.max(
    0,
    Math.floor(
      (new Date(s.outTime.replace(" ", "T")).getTime() -
        new Date(s.inTime.replace(" ", "T")).getTime()) /
        1000
    )
  );
}


function recomputeAcc(sessions: SessionEntry[]): number {
  return sessions.reduce((sum, s) => sum + sessionSecs(s), 0);
}



const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-[var(--muted)]/40 ${className}`} />
);



interface AttendanceTimerProps {
  inTime: string | null;
  outTime: string | null;
  loading: boolean;
  employeeId: string;
}

const AttendanceTimer: React.FC<AttendanceTimerProps> = ({
  inTime,
  outTime,
  loading,
  employeeId,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayStr = (() => {
    const base = inTime ? new Date(inTime.replace(" ", "T")) : new Date();
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!employeeId) return;


    if (!inTime) {
      sessionStorage.removeItem(accKey(employeeId, todayStr));
      setElapsed(0);
      setIsRunning(false);
      return;
    }


    if (inTime && outTime) {
      const stored = loadAcc(employeeId, todayStr);

    
      const alreadyCounted = stored.sessions.some(
        (s) => s.inTime === inTime && s.outTime === outTime
      );

      let updatedSessions: SessionEntry[];
      if (alreadyCounted) {
        updatedSessions = stored.sessions;
      } else {
        updatedSessions = [...stored.sessions, { inTime, outTime }];
      }

      const totalSecs = recomputeAcc(updatedSessions);
      saveAcc(employeeId, todayStr, { accSecs: totalSecs, sessions: updatedSessions });

      setElapsed(totalSecs);
      setIsRunning(false);
      return;
    }

    const stored = loadAcc(employeeId, todayStr);
    const prevAcc = recomputeAcc(stored.sessions);

    if (prevAcc !== stored.accSecs) {
      saveAcc(employeeId, todayStr, { ...stored, accSecs: prevAcc });
    }

    const sessionStart = new Date(inTime.replace(" ", "T")).getTime();

    const tick = () => {
      const liveSecs = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
      setElapsed(prevAcc + liveSecs);
    };
    tick();
    setIsRunning(true);
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inTime, outTime, employeeId]);

  const hoursDisplay =
    elapsed > 0
      ? formatElapsed(elapsed)
      : formatDuration(workingMinutes(inTime, outTime));

  return (
    <div className="rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/6 p-3 text-left flex-1 min-w-0 h-[75px]">
      {loading ? (
        <Skeleton className="h-full w-full min-h-[60px]" />
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Timer size={13} className="text-[var(--primary)]" />
            {isRunning && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <p className="text-base font-bold leading-tight text-[var(--primary)] font-mono tracking-tight">
            {hoursDisplay}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Hours Worked</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTimer;