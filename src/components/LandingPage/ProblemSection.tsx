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
    <section className="section relative overflow-hidden bg-white">

      {/* 🌤️ Soft Premium Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_60%)] pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md">

          <h2 className="text-[34px] md:text-[42px] font-semibold leading-tight text-gray-900 tracking-tight">
            Running your business shouldn’t feel this chaotic
          </h2>

          <p className="text-[16px] text-gray-600 leading-relaxed">
            Yet most businesses are stuck with disconnected tools, manual work, and constant guesswork.
          </p>

        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mt-14">

          {/* LEFT: SYSTEM PANEL */}
          <div className="relative">

            {/* Subtle glow (neutral, not aggressive) */}
            <div className="absolute inset-0 bg-gray-200/60 blur-3xl rounded-3xl opacity-40"></div>

            <div className="relative rounded-2xl p-6 border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">

              <p className="text-[11px] text-gray-500 mb-5 tracking-[0.15em] uppercase">
                System Alert
              </p>

              <div className="space-y-4">

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-gray-700">Invoice #2345</span>
                  <span className="text-red-500/80 font-medium">Mismatch</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-gray-700">Payment Status</span>
                  <span className="text-amber-500/80 font-medium">Unclear</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-gray-700">Stock Count</span>
                  <span className="text-red-500/80 font-medium">Out of sync</span>
                </div>

              </div>

              <div className="divider bg-gray-200 my-5" />

              <p className="text-[12px] text-gray-500 leading-relaxed">
                Your systems aren’t aligned — and it’s costing you time and money.
              </p>

            </div>

          </div>

          {/* RIGHT: PROBLEMS */}
          <div className="grid sm:grid-cols-2 gap-6">

            {problems.map((item, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:bg-white"
              >

                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold mb-3 transition-all group-hover:bg-red-500/10 group-hover:text-red-500">
                  !
                </div>

                {/* Text */}
                <h3 className="text-[14px] font-semibold text-gray-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-[13px] text-gray-600 leading-relaxed mt-1">
                  {item.desc}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* 🔥 EMOTIONAL CLOSE */}
        <div className="text-center mt-20">

          <p className="text-[18px] text-gray-600 max-w-xl mx-auto leading-relaxed">
            Manual errors. Lost revenue. Delayed decisions.
            <br />
            <span className="text-gray-900 font-medium">
              Your business deserves better systems.
            </span>
          </p>

        </div>

      </div>
    </section>
  );
};

export default ProblemSection;