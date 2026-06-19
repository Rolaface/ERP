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
    <section id="how-it-works" className="section relative overflow-hidden" style={{ background: "#f8fafd" }}>

      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(37,99,235,0.04))" }}
      />

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">
          <h2
            className="text-[34px] md:text-[40px] font-semibold leading-tight tracking-tight"
            style={{ color: "#0f1f3d" }}
          >
            Get started in minutes —{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              not weeks
            </span>
          </h2>

          <p className="text-[15px] leading-relaxed" style={{ color: "#5a7199" }}>
            Set up once, and your entire business runs smoothly from there.
          </p>
        </div>

        {/* TIMELINE */}
        <div className="relative mt-16">

          {/* MAIN LINE */}
          <div
            className="hidden md:block absolute top-10 left-0 w-full h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(37,99,235,0.35), transparent)",
            }}
          />

          <div className="grid md:grid-cols-4 gap-10">

            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="relative flex flex-col items-center text-center group animate-fade-up"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >

                  {/* NODE */}
                  <div className="relative mb-6">

                    {/* Glow */}
                    <div
                      className="absolute inset-0 w-16 h-16 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "rgba(37,99,235,0.18)" }}
                    ></div>

                    {/* Circle */}
                    <div
                      className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
                      style={{ background: "#fff", border: "1px solid rgba(200,218,240,0.60)" }}
                    >
                      <Icon size={20} style={{ color: "#2563eb" }} />
                    </div>

                    {/* Step Number */}
                    <div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-[2px] rounded-full text-white text-[10px] font-semibold shadow"
                      style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
                    >
                      {step.id}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="max-w-[220px] stack-sm">

                    <h3 className="text-[15px] font-semibold" style={{ color: "#0f1f3d" }}>
                      {step.title}
                    </h3>

                    <p className="text-[13px] leading-relaxed" style={{ color: "#5a7199" }}>
                      {step.desc}
                    </p>

                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* TRUST LINE */}
        <div className="mt-16 text-center animate-fade-in">

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
            style={{ background: "#fff", border: "1px solid rgba(200,218,240,0.60)" }}
          >
            <ShieldCheck size={14} style={{ color: "#2563eb" }} />
            <p className="text-[13px]" style={{ color: "#5a7199" }}>
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
            animation: hiwFadeIn 0.6s ease forwards;
          }

          .animate-fade-up {
            opacity: 0;
            transform: translateY(30px);
            animation: hiwFadeUp 0.7s ease forwards;
          }

          @keyframes hiwFadeIn {
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes hiwFadeUp {
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </section>
  );
};

export default HowItWorks;