import React from "react";

const TeamAvailability: React.FC = () => {
  return (
    <section className="space-y-3">

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]" />

        <h2
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.18em]
            text-[var(--muted-foreground)]
          "
        >
          Collaboration Availability
        </h2>
      </div>

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-x-3
          gap-y-2
          text-sm
          text-[var(--muted-foreground)]
        "
      >
        <span>Engineering busy</span>

        <span className="opacity-40">•</span>

        <span>Product available after 3 PM</span>

        <span className="opacity-40">•</span>

        <span>HR responsive</span>
      </div>

    </section>
  );
};

export default TeamAvailability;