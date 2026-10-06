import React from "react";
import { cardCls } from "./Styles";

interface Props {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<Props> = ({ title, subtitle, right, children }) => (
  <section className={`${cardCls} flex min-w-0 flex-col gap-4 p-5`}>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-main">{title}</h3>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      {right}
    </header>
    {children}
  </section>
);

export const ChartEmpty: React.FC = () => (
  <p className="py-10 text-center text-xs text-muted">No projects found for the selected filters.</p>
);

export default ChartCard;