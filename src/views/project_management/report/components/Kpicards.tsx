import React from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Layers } from "lucide-react";
import { cardCls } from "./Styles";
import { clampPercent, formatPercent, tint } from "../Utils";
import type { KpiDeltas, KpiKey, SummaryKpis } from "../Types";

const Donut: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent, size = 64, stroke = 9,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clampPercent(percent) / 100);
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
    </svg>
  );
};

const IconTile: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
    style={{ background: tint(tone, 12), color: `var(${tone})` }}
  >
    {children}
  </div>
);

const Delta: React.FC<{ value: number; goodWhenUp: boolean }> = ({ value, goodWhenUp }) => {
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
      <span
        className="inline-flex items-center gap-0.5 font-semibold"
        style={{ color: good ? "var(--success)" : "var(--danger)" }}
      >
        <Arrow size={11} />
        {Math.abs(value)}%
      </span>
      from last period
    </p>
  );
};

interface CardProps {
  label: string;
  value: string | number;
  visual: React.ReactNode;
  delta?: number;
  goodWhenUp?: boolean;
}

const KpiCard: React.FC<CardProps> = ({ label, value, visual, delta, goodWhenUp = true }) => (
  <div className={`${cardCls} flex items-center gap-4 p-4`}>
    {visual}
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold leading-tight text-main">{value}</p>
      {delta !== undefined && <Delta value={delta} goodWhenUp={goodWhenUp} />}
    </div>
  </div>
);

interface Props {
  kpis: SummaryKpis;
  deltas?: KpiDeltas;
}

const KpiCards: React.FC<Props> = ({ kpis, deltas = {} }) => {
  const d = (k: KpiKey) => deltas[k];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Average Completion"
        value={formatPercent(kpis.averageCompletion)}
        visual={<Donut percent={kpis.averageCompletion} />}
        delta={d("averageCompletion")}
      />
      <KpiCard
        label="Total Tasks"
        value={kpis.totalTasks}
        visual={<IconTile tone="--primary"><Layers size={24} /></IconTile>}
        delta={d("totalTasks")}
      />
      <KpiCard
        label="Completed Tasks"
        value={kpis.completedTasks}
        visual={<IconTile tone="--success"><CheckCircle2 size={24} /></IconTile>}
        delta={d("completedTasks")}
      />
      <KpiCard
        label="Overdue Tasks"
        value={kpis.overdueTasks}
        visual={<IconTile tone="--danger"><Clock size={24} /></IconTile>}
        delta={d("overdueTasks")}
        goodWhenUp={false}
      />
    </div>
  );
};

export default KpiCards;