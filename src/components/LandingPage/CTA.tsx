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
    <section className="section-lg bg-[#070d1a] text-white relative overflow-hidden py-[120px] md:py-[160px]">

      {/* 🌟 BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Primary spotlight */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_65%)] blur-[110px]" />

        {/* Secondary accent */}
        <div className="absolute bottom-[-30%] right-[15%] w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_70%)] blur-[100px]" />

        {/* 🔥 NEW: ultra slow animated gradient */}
        <div className="absolute inset-0 opacity-[0.06] animate-gradient-slow bg-[linear-gradient(120deg,rgba(59,130,246,0.3),rgba(99,102,241,0.3),rgba(59,130,246,0.3))]" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="container-app text-center relative z-10">

        {/* HEADER */}
        <div className="max-w-3xl mx-auto stack-lg animate-fade-in">

          <h2 className="text-[38px] md:text-[56px] font-semibold leading-tight tracking-tight">

            <span className="text-red-400">
              Stop running your business in chaos.
            </span>

            <br />

            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              Start running it with clarity.
            </span>

          </h2>

          <p className="text-[16px] text-gray-300 max-w-xl mx-auto leading-relaxed">
            Replace spreadsheets, scattered tools, and constant guesswork
            with one system built to give you complete control.
          </p>

        </div>

        {/* CTA BLOCK */}
        <div className="mt-14 flex flex-col items-center gap-6 animate-fade-up">

          {/* 🔥 PRIMARY CTA (more dominant) */}
          <div className="relative group">

            {/* Stronger glow */}
            <div className="absolute inset-0 rounded-[calc(var(--density-radius)*1.5)] bg-primary/40 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Gradient border */}
            <div className="p-[1px] rounded-[calc(var(--density-radius)*1.5)] bg-gradient-to-r from-[var(--primary)] via-[var(--primary-600)] to-[var(--primary)] animate-gradient-x">

              <button className="relative bg-[var(--primary)] text-white rounded-[calc(var(--density-radius)*1.5)] px-[calc(var(--density-padding-lg)*2.6)] py-[calc(var(--density-padding-md)*1.6)] text-[16px] font-semibold flex items-center gap-3 shadow-2xl hover:shadow-[0_25px_70px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:scale-[1.06] active:scale-[0.97]">

                Start Free Trial

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={20} />
                </span>

              </button>

            </div>
          </div>

          {/* TRUST LINE */}
          <p className="text-[13px] text-gray-400">
            No credit card required • Setup in under 2 minutes
          </p>

          {/* SOCIAL MOMENTUM */}
          <p className="text-[12px] text-gray-500">
            🔥 {count}+ businesses started this month
          </p>

        </div>

        {/* INLINE TESTIMONIAL */}
        <div className="mt-12 flex justify-center animate-fade-in">

          <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-[calc(var(--density-radius)*1.5)] backdrop-blur-md max-w-md">

            <div className="w-9 h-9 rounded-full bg-[var(--row-hover)] flex items-center justify-center text-[11px] font-semibold text-white">
              AK
            </div>

            <p className="text-[13px] text-gray-300 leading-snug">
              “We switched last month — saved hours every week already.”
              <span className="block text-[11px] text-gray-500 mt-1">
                — Ankit Kumar, Distributor
              </span>
            </p>

          </div>

        </div>

        {/* TRUST SIGNALS */}
        <div className="mt-14 flex flex-wrap justify-center gap-5 animate-fade-in">

          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 backdrop-blur-md">
            <ShieldCheck size={14} className="text-[var(--primary)]" />
            No credit card required
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 backdrop-blur-md">
            <Zap size={14} className="text-[var(--primary)]" />
            Setup in minutes
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 backdrop-blur-md">
            <Users size={14} className="text-[var(--primary)]" />
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

          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradientMove 4s ease infinite;
          }

          /* 🔥 NEW: ultra slow premium gradient */
          .animate-gradient-slow {
            background-size: 300% 300%;
            animation: gradientSlow 18s ease infinite;
          }

          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes gradientSlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
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

export default CTA;