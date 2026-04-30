import React, { useEffect, useRef, useState } from "react";

const features = [
  {
    badge: "Automation",
    title: "Track payments without manual follow-ups",
    desc: "Automatically reconcile transactions and eliminate guesswork around receivables.",
    proof: "Reduces follow-ups by 70%",
    image: "/dashboard.png",
  },
  {
    badge: "Visibility",
    title: "Know exactly who owes you, in real-time",
    desc: "Clear, real-time insights into receivables, payments, and outstanding balances.",
    proof: "Used by 120+ distributors",
    image: "/dashboard.png",
  },
  {
    badge: "Accuracy",
    title: "Eliminate costly manual errors",
    desc: "Reduce mistakes with synced systems that update everything instantly.",
    proof: "Cuts reconciliation errors significantly",
    image: "/dashboard.png",
  },
];

const SolutionSection: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
      className="section-lg relative overflow-hidden"
      style={{
        background: "var(--surface-1)",
      }}
    >
      {/* Softer relief glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, rgba(59,130,246,0.05), transparent 60%)",
        }}
      />

      <div className="container-wide relative z-10">

        {/* HEADER */}
        <div
          className={`
            max-w-2xl mx-auto text-center stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary font-semibold">
            The Fix
          </p>

          <h2 className="text-[36px] md:text-[44px] font-semibold text-main leading-tight">
            Finally, everything works together
          </h2>

          <p className="text-[16px] text-muted leading-relaxed">
            Replace scattered tools with a single system designed for clarity,
            automation, and control.
          </p>
        </div>

        {/* FEATURES */}
        <div className="mt-24 space-y-28">
          {features.map((feature, i) => {
            const isAlt = i % 2 !== 0;
            const isActive = activeIndex === i;

            return (
              <div
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`
                  grid lg:grid-cols-2 gap-14 items-center
                  transition-all duration-700
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                `}
                style={{ transitionDelay: `${i * 120}ms` }}
              >

                {/* TEXT */}
                <div className={`${isAlt ? "lg:order-2" : ""} max-w-[520px]`}>
                  
                  <div className="badge w-fit mb-4">
                    {feature.badge}
                  </div>

                  <h3 className="text-[30px] font-semibold text-main leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-[15px] text-muted mt-3 leading-relaxed">
                    {feature.desc}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[13px] text-primary font-medium">
                    <span>✔</span>
                    <span>{feature.proof}</span>
                  </div>
                </div>

                {/* IMAGE */}
                <div className={`relative ${isAlt ? "lg:order-1" : ""}`}>

                  {/* Reduced ghost (less noise) */}
                  <div className="absolute -top-3 -left-3 w-full h-full rounded-3xl opacity-15 blur-sm pointer-events-none">
                    <img
                      src={feature.image}
                      alt=""
                      className="w-full h-full object-cover rounded-3xl grayscale"
                    />
                  </div>

                  {/* Minimal glow */}
                  <div
                    className={`
                      absolute inset-0 rounded-3xl blur-3xl transition-all duration-500
                      ${isActive ? "opacity-20 scale-105" : "opacity-10"}
                    `}
                    style={{
                      background: "var(--gradient-primary)",
                    }}
                  />

                  {/* Main elevated card */}
                  <div
                    className={`
                      relative rounded-3xl overflow-hidden
                      transition-all duration-500
                      ${isActive ? "scale-[1.02]" : ""}
                    `}
                    style={{
                      transform: "perspective(1200px) rotateY(-2deg)",
                      boxShadow: "var(--shadow-lg)", // ✅ stronger elevation
                      maxWidth: "640px",
                    }}
                  >

                    {/* Subtle hover light */}
                    <div
                      className={`
                        absolute inset-0 pointer-events-none
                        transition-opacity duration-300
                        ${isActive ? "opacity-100" : "opacity-0"}
                      `}
                      style={{
                        background:
                          "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.12), transparent 60%)",
                      }}
                    />

                    {/* Very subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5" />

                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* CLOSING */}
        <div
          className={`
            text-center mt-28 transition-all duration-700 delay-500
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-[18px] text-muted max-w-xl mx-auto leading-relaxed">
            No more guesswork. No more scattered tools.
            <br />
            <span className="text-main font-medium">
              Just a clear, reliable system that works.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};

export default SolutionSection;