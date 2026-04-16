import React from "react";
import { Clock, ShieldCheck, TrendingUp, Eye, Zap, CheckCircle } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save hours every week",
    desc: "Automate repetitive work and reduce manual effort across your operations.",
  },
  {
    icon: Eye,
    title: "Complete visibility",
    desc: "Know exactly what’s happening across sales, inventory, and accounts in real-time.",
  },
  {
    icon: ShieldCheck,
    title: "Fewer mistakes, more accuracy",
    desc: "Eliminate costly errors caused by manual entries and disconnected systems.",
  },
  {
    icon: TrendingUp,
    title: "Make faster decisions",
    desc: "Use real-time insights to act quickly and confidently.",
  },
  {
    icon: Zap,
    title: "Run operations smoothly",
    desc: "Everything works together — no more switching tools or fixing mismatches.",
  },
  {
    icon: CheckCircle,
    title: "Scale without chaos",
    desc: "Grow your business without increasing operational complexity.",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="section section-default relative overflow-hidden">

      {/* Background Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md">

          <h2 className="text-[32px] md:text-[38px] font-semibold leading-snug text-main">
            Run your business with clarity, control, and confidence
          </h2>

          <p className="text-body text-muted">
            Everything works together so you can focus on growth — not fixing problems.
          </p>

        </div>

        {/* BENEFITS GRID */}
        <div className="mt-[calc(var(--density-gap)*4)] grid sm:grid-cols-2 lg:grid-cols-3 gap-[calc(var(--density-gap)*2)]">

          {benefits.map((item, i) => {
            const Icon = item.icon;

            return (
              <div
                key={i}
                className="group card card-hover flex flex-col gap-3 p-[calc(var(--density-gap)*2)] bg-white"
              >

                {/* ICON */}
                <div className="relative w-10 h-10 rounded-[var(--density-radius)] bg-white border border-theme flex items-center justify-center">

                  {/* Glow */}
                  <div className="absolute inset-0 bg-primary/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--density-radius)]"></div>

                  <Icon size={18} className="text-primary relative z-10" />
                </div>

                {/* TEXT */}
                <div className="stack-sm">

                  <h3 className="text-[15px] font-semibold text-main">
                    {item.title}
                  </h3>

                  <p className="text-[13px] text-muted leading-relaxed">
                    {item.desc}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

        {/* BOTTOM LINE */}
        <div className="text-center mt-[calc(var(--density-gap)*4)]">

          <p className="text-[16px] text-muted max-w-xl mx-auto">
            Less stress, fewer errors, and more control — so you can focus on growing your business instead of managing chaos.
          </p>

        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;