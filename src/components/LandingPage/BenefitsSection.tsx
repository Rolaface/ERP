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
    <section ref={sectionRef} className="section relative overflow-hidden" style={{ background: "#fff" }}>
      {/* Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at top, rgba(37,99,235,0.07), transparent 60%)" }}
      />

      <div className="container-app">

        {/* HEADER */}
        <div
          className={`
            text-center max-w-2xl mx-auto stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <h2
            className="text-[32px] md:text-[40px] font-semibold leading-snug tracking-tight"
            style={{ color: "#0f1f3d" }}
          >
            Run your business with clarity, control, and confidence
          </h2>

          <p className="text-[15px] leading-relaxed" style={{ color: "#5a7199" }}>
            Every module works together so you can focus on growth — not fixing problems.
          </p>
        </div>

        {/* GRID */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {benefits.map((item, i) => {
            const Icon = item.icon;

            return (
              <div
                key={i}
                className={`
                  group relative rounded-2xl p-[1px]
                  transition-all duration-500
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                `}
                style={{ transitionDelay: `${i * 90 + 150}ms` }}
              >
                {/* Gradient border */}
                <div
                  className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.40), transparent, rgba(37,99,235,0.40))",
                  }}
                />

                {/* Card */}
                <div
                  className="relative h-full rounded-[inherit] p-6 flex flex-col gap-5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
                  style={{ background: "#fff", border: "1px solid rgba(200,218,240,0.60)" }}
                >

                  {/* ICON */}
                  <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: "#fff", border: "1px solid rgba(200,218,240,0.60)" }}
                  >
                    <div
                      className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "rgba(37,99,235,0.18)" }}
                    />
                    <Icon size={20} style={{ color: "#2563eb" }} className="relative z-10" />
                  </div>

                  {/* TEXT */}
                  <div className="stack-sm">
                    <h3 className="text-[16px] font-semibold" style={{ color: "#0f1f3d" }}>
                      {item.title}
                    </h3>

                    <p className="text-[13px] leading-relaxed" style={{ color: "#5a7199" }}>
                      {item.desc}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* FOOTER */}
        <div
          className={`
            text-center mt-16
            transition-all duration-700 delay-500
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[16px] max-w-xl mx-auto leading-relaxed" style={{ color: "#5a7199" }}>
            Less stress. Fewer errors. More control.
            <br />
            <span className="font-medium" style={{ color: "#0f1f3d" }}>
              So you can focus on growing your business — not managing chaos.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;