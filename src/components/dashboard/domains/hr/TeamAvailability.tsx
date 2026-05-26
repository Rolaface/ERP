import React from "react";

import { Users2 } from "lucide-react";

const TeamAvailability: React.FC = () => {
  return (
    <section className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-2">

        <Users2 className="h-4 w-4 text-[var(--primary)]" />

        <h2
          className="
            text-sm
            font-semibold
            text-[var(--foreground)]
          "
        >
          Collaboration Context
        </h2>

      </div>

      {/* STATUS GRID */}
      <div className="grid grid-cols-1 gap-3">

        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--background)]
            p-3
          "
        >
          <p className="text-xs text-[var(--muted-foreground)]">
            Engineering
          </p>

          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            Deep work in progress
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--background)]
            p-3
          "
        >
          <p className="text-xs text-[var(--muted-foreground)]">
            Product Team
          </p>

          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            Available after 3 PM
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--background)]
            p-3
          "
        >
          <p className="text-xs text-[var(--muted-foreground)]">
            HR Operations
          </p>

          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            Responding normally
          </p>
        </div>

      </div>

    </section>
  );
};

export default TeamAvailability;