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
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_60%)] pointer-events-none" />

      <div className="container-app">

        {/* HEADER */}
        <div
          className={`
            text-center max-w-2xl mx-auto stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <h2 className="text-[32px] md:text-[40px] font-semibold leading-snug text-main tracking-tight">
            Run your business with clarity, control, and confidence
          </h2>

          <p className="text-body text-muted">
            Everything works together so you can focus on growth — not fixing problems.
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
                  transitionDelay: `${i * 90 + 150}ms`, // ✅ stagger
                }}
              >
                {/* Gradient border */}
                <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary/40 via-transparent to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

                {/* Card */}
                <div className="relative h-full rounded-[inherit] bg-card border border-theme p-[calc(var(--density-gap)*2.2)] flex flex-col gap-5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">

                  {/* ICON */}
                  <div className="relative w-12 h-12 rounded-[var(--density-radius)] flex items-center justify-center bg-card border border-theme overflow-hidden">

                    {/* glow pulse */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <Icon size={20} className="text-primary relative z-10" />
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

                  {/* subtle hover light sweep */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                    <div className="absolute -inset-[1px] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* FOOTER */}
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
              So you can focus on growing your business — not managing chaos.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;