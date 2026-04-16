import React from "react";

const problems = [
  {
    title: "Payments scattered across tools",
    desc: "Excel, WhatsApp, and accounting software — nothing stays in sync.",
  },
  {
    title: "No clarity on receivables",
    desc: "You’re guessing who paid and who didn’t instead of knowing.",
  },
  {
    title: "Manual entries causing costly mistakes",
    desc: "Small errors turn into serious financial discrepancies over time.",
  },
  {
    title: "Inventory, sales, and accounts disconnected",
    desc: "You’re making decisions based on outdated or incomplete data.",
  },
  {
    title: "End-of-month reconciliation chaos",
    desc: "Hours wasted fixing mismatches instead of focusing on growth.",
  },
];

const ProblemSection: React.FC = () => {
  return (
    <section className="section section-default relative overflow-hidden">

      {/* Subtle Background Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(220,38,38,0.04)] pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md">

          {/* Label */}
          <p className="text-[12px] text-muted font-medium tracking-wide">
            The Problem
          </p>

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Running your business shouldn’t feel this chaotic
          </h2>

          <p className="text-body text-muted">
            But most businesses still rely on disconnected tools, manual work, and constant guesswork.
          </p>

        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-[calc(var(--density-gap)*3)] items-start mt-[calc(var(--density-gap)*3)]">

          {/* LEFT: SIGNAL PANEL (UPGRADED) */}
          <div className="relative">

            <div className="bg-card border border-theme rounded-[calc(var(--density-radius)*1.5)] p-[calc(var(--density-gap)*2)] shadow-sm motion-hover-lift">

              <p className="text-[13px] text-muted mb-4">
                System Alert
              </p>

              <div className="stack-md">

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">Invoice #2345</span>
                  <span className="text-danger font-medium">Mismatch</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">Payment Status</span>
                  <span className="text-warning font-medium">Unclear</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">Stock Count</span>
                  <span className="text-danger font-medium">Out of sync</span>
                </div>

              </div>

              <div className="divider" />

              <p className="text-[12px] text-muted">
                Your systems aren’t aligned — and it’s costing you time and money.
              </p>

            </div>

          </div>

          {/* RIGHT: PROBLEMS (UPGRADED CARDS) */}
          <div className="grid sm:grid-cols-2 gap-[var(--density-gap)]">

            {problems.map((item, i) => (
              <div
                key={i}
                className="card card-hover flex gap-3 items-start"
              >

                {/* ICON */}
                <div className="mt-1 w-7 h-7 rounded-full bg-[rgba(220,38,38,0.08)] flex items-center justify-center text-danger text-xs font-bold">
                  ✕
                </div>

                {/* TEXT */}
                <div>
                  <h3 className="text-[14px] font-semibold text-main leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-muted leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* BOTTOM LINE (STRONGER EMOTION) */}
        <div className="text-center mt-[calc(var(--density-gap)*4)]">

          <p className="text-[16px] text-muted max-w-xl mx-auto">
            You’re putting in the effort — but your systems are slowing you down and creating problems you shouldn’t have to deal with.
          </p>

        </div>

      </div>
    </section>
  );
};

export default ProblemSection;