import React, { useEffect, useRef, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // ✅ Scroll-triggered reveal
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // run once
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-lg section-default relative overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.04))",
        }}
      />
      <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />

      <div className="container-wide relative z-10">

        {/* HEADER */}
        <div
          className={`
            max-w-2xl mx-auto text-center stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <h2 className="text-[34px] md:text-[42px] font-semibold leading-tight tracking-tight text-main">
            Running your business shouldn’t feel this chaotic
          </h2>

          <p className="text-[16px] text-muted leading-relaxed">
            Yet most businesses are stuck with disconnected tools, manual work,
            and constant guesswork.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mt-16">

          {/* LEFT PANEL */}
          <div
            className={`
              relative transition-all duration-700 delay-100
              ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
            `}
          >
            <div
              className="absolute inset-0 blur-3xl rounded-3xl opacity-20"
              style={{ background: "var(--danger)" }}
            />

            <div className="relative bg-surface-2 border border-theme rounded-2xl p-6 shadow-soft-xl backdrop-blur-md">
              <p className="text-[11px] text-muted mb-5 tracking-[0.15em] uppercase">
                System Errors
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-main">Invoice #2345</span>
                  <span className="text-danger font-medium">Mismatch</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-main">Payment Status</span>
                  <span className="text-warning font-medium">Unclear</span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-main">Stock Count</span>
                  <span className="text-danger font-medium">Out of sync</span>
                </div>
              </div>

              <div className="divider my-5" />

              <p className="text-[12px] text-muted leading-relaxed">
                Your systems aren’t aligned — and it’s costing you time and money.
              </p>
            </div>
          </div>

          {/* RIGHT: CARDS */}
          <div className="flex flex-col gap-4">

            {problems.map((item, i) => {
              const isActive = activeIndex === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`
                    card-interactive group relative rounded-xl p-5 border border-theme
                    transition-all duration-500 cursor-pointer
                    ${isActive ? "shadow-soft-xl scale-[1.02]" : "opacity-80"}
                    ${activeIndex !== null && !isActive ? "opacity-40 blur-[1px]" : ""}
                    ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                  `}
                  style={{
                    background: "var(--surface-1)",
                    transitionDelay: `${i * 80 + 200}ms`, // ✅ stagger
                  }}
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 20%, rgba(220,38,38,0.08), transparent 60%)",
                    }}
                  />

                  <div className="relative flex items-start gap-4">
                    <div
                      className="mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                      style={{
                        background: "rgba(220,38,38,0.12)",
                        color: "var(--danger)",
                      }}
                    >
                      !
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-main leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-[13px] text-muted leading-relaxed mt-1 max-w-[420px]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`
            text-center mt-20 transition-all duration-700 delay-500
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[18px] text-muted max-w-xl mx-auto leading-relaxed">
            Manual errors. Lost revenue. Delayed decisions.
            <br />
            <span className="text-main font-medium">
              Your business deserves better systems.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};

export default ProblemSection;