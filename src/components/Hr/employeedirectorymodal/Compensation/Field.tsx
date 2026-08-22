import React from "react";

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ label, children, badge }) => (
  <div className="flex flex-col gap-1 min-w-0 w-full">
    <div className="flex items-center gap-1.5 min-w-0">
      <label className="text-[11px] font-medium text-muted leading-none truncate">
        {label}
      </label>
      {badge}
    </div>
    {children}
  </div>
);
