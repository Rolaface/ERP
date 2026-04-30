import React, { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

const CTA: React.FC = () => {
  const [count, setCount] = useState(487);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => (prev < 523 ? prev + 1 : prev));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ✅ PRE-SECTION (calm emotional bridge) */}
      <div className="section text-center bg-surface-1">
        <div className="container-app max-w-2xl mx-auto">
          <p className="text-[15px] text-muted leading-relaxed">
            You’ve seen the problems. You’ve seen the solution.
            <br />
            <span className="text-main font-medium">
              Now it’s time to simplify how your business runs.
            </span>
          </p>
        </div>
      </div>

      {/* 🚀 CTA SECTION */}
      <section className="section-lg relative overflow-hidden text-white py-[140px] md:py-[180px]">

        {/* ✅ PRIMARY GRADIENT BACKGROUND */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-primary)" }}
        />

        {/* ✅ SOFT GLOW LAYER */}
        <div className="absolute inset-0 glow-soft opacity-70 pointer-events-none" />

        {/* Subtle grid (kept minimal) */}
        <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />

        <div className="container-app text-center relative z-10">

          {/* HEADER */}
          <div className="max-w-3xl mx-auto stack-lg animate-fade-in">

            <h2 className="text-[40px] md:text-[58px] font-semibold leading-tight tracking-tight">

              <span className="text-white/90">
                Stop running your business in chaos.
              </span>

              <br />

              <span className="text-white">
                Start running it with clarity.
              </span>

            </h2>

            <p className="text-[17px] text-white/80 max-w-xl mx-auto leading-relaxed">
              Replace spreadsheets, scattered tools, and constant guesswork
              with one system built to give you complete control.
            </p>

          </div>

          {/* CTA BLOCK */}
          <div className="mt-16 flex flex-col items-center gap-6 animate-fade-up">

            {/* PRIMARY CTA */}
            <div className="relative group">

              {/* Soft glow (less aggressive) */}
              <div className="absolute inset-0 rounded-[calc(var(--density-radius)*1.5)] bg-white/20 blur-2xl opacity-60 group-hover:opacity-80 transition duration-500" />

              <button className="relative bg-white text-black rounded-[calc(var(--density-radius)*1.5)] px-[calc(var(--density-padding-lg)*2.8)] py-[calc(var(--density-padding-md)*1.7)] text-[16px] font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.05] active:scale-[0.97]">

                Start Free Trial

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={20} />
                </span>

              </button>
            </div>

            {/* TRUST LINE */}
            <p className="text-[13px] text-white/80">
              No credit card required • Setup in under 2 minutes
            </p>

            {/* SOCIAL MOMENTUM */}
            <p className="text-[12px] text-white/70">
              {count}+ businesses started this month
            </p>

          </div>

          {/* INLINE TESTIMONIAL (cleaner, less heavy) */}
          <div className="mt-14 flex justify-center animate-fade-in">

            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 rounded-[calc(var(--density-radius)*1.5)] backdrop-blur-sm max-w-md">

              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-semibold">
                AK
              </div>

              <p className="text-[13px] text-white/85 leading-snug">
                “We switched last month — saved hours every week already.”
                <span className="block text-[11px] text-white/60 mt-1">
                  — Ankit Kumar, Distributor
                </span>
              </p>

            </div>

          </div>

          {/* TRUST SIGNALS (reduced visual noise) */}
          <div className="mt-16 flex flex-wrap justify-center gap-4 animate-fade-in">

            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-[12px] text-white/80 backdrop-blur-sm">
              <ShieldCheck size={14} />
              No credit card required
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-[12px] text-white/80 backdrop-blur-sm">
              <Zap size={14} />
              Setup in minutes
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-[12px] text-white/80 backdrop-blur-sm">
              <Users size={14} />
              Trusted by 500+ businesses
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
    </>
  );
};

export default CTA;