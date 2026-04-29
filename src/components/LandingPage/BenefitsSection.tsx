import React, { useEffect, useRef, useState } from "react";
import {
  Clock,
  ShieldCheck,
  TrendingUp,
  Eye,
  Zap,
  CheckCircle,
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save hours every week",
    desc: "Automate repetitive work and reduce manual effort across your operations.",
    highlight: "Automation",
  },
  {
    icon: Eye,
    title: "Complete visibility",
    desc: "Know exactly what’s happening across sales, inventory, and accounts in real-time.",
    highlight: "Real-time",
  },
  {
    icon: ShieldCheck,
    title: "Fewer mistakes, more accuracy",
    desc: "Eliminate costly errors caused by manual entries and disconnected systems.",
    highlight: "Reliable",
  },
  {
    icon: TrendingUp,
    title: "Make faster decisions",
    desc: "Use real-time insights to act quickly and confidently.",
    highlight: "Insights",
  },
  {
    icon: Zap,
    title: "Run operations smoothly",
    desc: "Everything works together — no more switching tools or fixing mismatches.",
    highlight: "Seamless",
  },
  {
    icon: CheckCircle,
    title: "Scale without chaos",
    desc: "Grow your business without increasing operational complexity.",
    highlight: "Scalable",
  },
];

const BenefitsSection: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
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
      className="section section-default relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />

      <div className="container-app">

        {/* HEADER */}
        <div
          className={`
            text-center max-w-2xl mx-auto stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary font-semibold">
            Benefits
          </p>

          <h2 className="text-[34px] md:text-[42px] font-semibold leading-tight text-main tracking-tight">
            Everything you need to run
            <span className="text-gradient"> a smoother business</span>
          </h2>

          <p className="text-[15px] text-muted leading-relaxed">
            Not just features — outcomes that directly improve your daily operations.
          </p>
        </div>

        {/* GRID */}
        <div className="mt-[calc(var(--density-gap)*5)] grid sm:grid-cols-2 lg:grid-cols-3 gap-[calc(var(--density-gap)*2.5)]">

          {benefits.map((item, i) => {
            const Icon = item.icon;

            return (
              <div
                key={i}
                className={`
                  group relative rounded-[calc(var(--density-radius)*1.5)] p-[1px]
                  transition-all duration-500
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                `}
                style={{
                  transitionDelay: `${i * 90 + 150}ms`,
                }}
              >
                {/* Gradient border */}
                <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary/40 via-transparent to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

                {/* Card */}
                <div className="relative h-full rounded-[inherit] bg-card border border-theme p-[calc(var(--density-gap)*2.2)] flex flex-col gap-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-soft-xl">

                  {/* TOP ROW */}
                  <div className="flex items-center justify-between">

                    {/* Icon */}
                    <div className="relative w-12 h-12 rounded-[var(--density-radius)] flex items-center justify-center bg-card border border-theme overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Icon size={20} className="text-primary relative z-10" />
                    </div>

                    {/* Micro tag */}
                    <span className="text-[10px] px-2 py-[3px] rounded-full bg-primary/10 text-primary font-medium">
                      {item.highlight}
                    </span>
                  </div>

                  {/* TEXT */}
                  <div className="stack-sm">
                    <h3 className="text-[16px] font-semibold text-main">
                      {item.title}
                    </h3>

                    <p className="text-[13px] text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom subtle reinforcement */}
                  <div className="mt-auto pt-3 border-t border-theme/60">
                    <p className="text-[12px] text-muted">
                      ✔ Improves operational efficiency
                    </p>
                  </div>

                  {/* Light sweep */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                    <div className="absolute -inset-[1px] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* FOOTER (conversion push) */}
        <div
          className={`
            text-center mt-[calc(var(--density-gap)*5)]
            transition-all duration-700 delay-500
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[16px] text-muted max-w-xl mx-auto leading-relaxed">
            Less stress. Fewer errors. More control.
            <br />
            <span className="text-main font-medium">
              This is what operational clarity feels like.
            </span>
          </p>

          {/* subtle CTA bridge */}
          <div className="mt-4">
            <span className="text-[13px] text-primary font-medium">
              Start experiencing this in minutes →
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;