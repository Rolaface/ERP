import React from "react";
import { Building2, Receipt, BarChart3, ShieldCheck } from "lucide-react";

const steps = [
  {
    id: "01",
    icon: Building2,
    title: "Set up your business in minutes",
    desc: "Add your company, team, and accounts to get started — no complex setup required.",
  },
  {
    id: "02",
    icon: Receipt,
    title: "Start recording transactions",
    desc: "Log sales, purchases, and payments in a clean, intuitive workflow.",
  },
  {
    id: "03",
    icon: BarChart3,
    title: "Track everything in real-time",
    desc: "Your dashboard updates instantly, giving you complete visibility into operations.",
  },
  {
    id: "04",
    icon: ShieldCheck,
    title: "Stay in control at all times",
    desc: "Monitor cash flow, dues, and profits without chasing data across tools.",
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="section section-default relative overflow-hidden">

      {/* Background Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <p className="text-[12px] text-muted font-medium tracking-wide">
            How it works
          </p>

          <h2 className="text-[32px] md:text-[38px] font-semibold leading-snug text-main">
            Get started in minutes —{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              not weeks
            </span>
          </h2>

          <p className="text-body text-muted">
            Set up once, and your entire business runs smoothly from there.
          </p>

        </div>

        {/* STEPS */}
        <div className="relative mt-[calc(var(--density-gap)*4)] grid md:grid-cols-4 gap-[calc(var(--density-gap)*2.5)]">

          {/* Connector line (more subtle) */}
          <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative group animate-fade-up"
                style={{ animationDelay: `${index * 0.12}s` }}
              >

                <div className="card card-hover flex flex-col items-center text-center md:items-start md:text-left p-[calc(var(--density-gap)*2)] h-full">

                  {/* ICON + NUMBER */}
                  <div className="relative mb-4">

                    {/* Glow */}
                    <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--density-radius)]"></div>

                    <div className="relative w-12 h-12 rounded-[var(--density-radius)] bg-card border border-theme flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                      <Icon size={20} className="text-primary" />
                    </div>

                    {/* STEP NUMBER */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                      {step.id}
                    </div>

                  </div>

                  {/* CONTENT */}
                  <div className="stack-sm">

                    <h3 className="text-[16px] font-semibold text-main">
                      {step.title}
                    </h3>

                    <p className="text-[13px] text-muted leading-relaxed">
                      {step.desc}
                    </p>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

        {/* BOTTOM TRUST LINE */}
        <div className="mt-[calc(var(--density-gap)*4)] text-center animate-fade-in">

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-full shadow-sm">

            <ShieldCheck size={14} className="text-primary" />

            <p className="text-[13px] text-muted">
              No training required — your team can start instantly
            </p>

          </div>

        </div>

      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeIn 0.6s ease forwards;
          }

          .animate-fade-up {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeUp 0.7s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
};

export default HowItWorks;