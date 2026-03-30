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
    <section className="section section-default overflow-hidden">

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

        

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Get started in minutes,{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              not weeks
            </span>
          </h2>

          <p className="text-body text-muted">
            A simple step-by-step flow to run your entire business without chaos.
          </p>

        </div>

        {/* STEPS */}
        <div className="relative mt-[calc(var(--density-gap)*4)] grid md:grid-cols-4 gap-[calc(var(--density-gap)*2)]">

          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-[var(--border)]" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-center text-center md:text-left md:items-start animate-fade-up"
                style={{ animationDelay: `${index * 0.12}s` }}
              >

                {/* ICON */}
                <div className="relative mb-4">

                  <div className="w-12 h-12 rounded-[var(--density-radius)] bg-card border border-theme flex items-center justify-center transition-all duration-300 hover:scale-105">
                    <Icon size={20} className="text-primary" />
                  </div>

                  {/* STEP NUMBER */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
                    {step.id}
                  </div>

                </div>

                {/* CONTENT */}
                <div className="stack-sm max-w-[220px]">

                  <h3 className="text-[15px] font-semibold text-main">
                    {step.title}
                  </h3>

                  <p className="text-[13px] text-muted leading-relaxed">
                    {step.desc}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

        {/* BOTTOM TRUST LINE */}
        <div className="mt-[calc(var(--density-gap)*4)] text-center animate-fade-in">

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-full">

            <ShieldCheck size={14} className="text-primary" />

            <p className="text-[13px] text-muted">
              No technical setup required — your team can start instantly
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