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
      className="section-lg section-default relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />

      <div className="container-wide relative z-10">

        {/* HEADER */}
        <div
          className={`
            max-w-2xl mx-auto text-center stack-md
            transition-all duration-700
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <h2 className="text-[36px] md:text-[44px] font-semibold text-main">
            Finally, everything works together
          </h2>

          <p className="text-[16px] text-muted">
            Replace scattered tools with a single system designed for clarity,
            automation, and control.
          </p>
        </div>

        {/* FEATURES */}
        <div className="mt-20 space-y-24">
          {features.map((feature, i) => {
            const isAlt = i % 2 !== 0;
            const isActive = activeIndex === i;

            return (
              <div
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`
                  grid lg:grid-cols-2 gap-12 items-center
                  transition-all duration-700
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
                `}
              >

                {/* TEXT */}
                <div
                  className={`${isAlt ? "lg:order-2" : ""} max-w-[520px]`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <span className="text-[11px] tracking-[0.14em] uppercase text-primary font-semibold">
                    {feature.badge}
                  </span>

                  <h3 className="text-[30px] font-semibold text-main mt-3">
                    {feature.title}
                  </h3>

                  <p className="text-[15px] text-muted mt-3">
                    {feature.desc}
                  </p>

                  {/* MICRO PROOF */}
                  <p className="text-[13px] text-primary mt-3 font-medium">
                    {feature.proof}
                  </p>
                </div>

                {/* IMAGE */}
                <div
                  className={`relative group ${isAlt ? "lg:order-1" : ""}`}
                  style={{ transitionDelay: "120ms" }}
                >

                  {/* BEFORE STATE (ghost) */}
                  <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl opacity-30 blur-sm pointer-events-none">
                    <img
                      src={feature.image}
                      alt=""
                      className="w-full h-full object-cover rounded-3xl grayscale"
                    />
                  </div>

                  {/* Glow layer */}
                  <div
                    className={`
                      absolute inset-0 rounded-3xl blur-3xl transition-all duration-500
                      ${isActive ? "opacity-30 scale-105" : "opacity-20"}
                    `}
                    style={{
                      background: "var(--gradient-primary)",
                      transitionDelay: "200ms",
                    }}
                  />

                  <div
                    className={`
                      relative rounded-3xl overflow-hidden
                      transition-all duration-500
                      ${isActive ? "scale-[1.02]" : ""}
                    `}
                    style={{
                      transform: "perspective(1200px) rotateY(-3deg)",
                      boxShadow: "var(--shadow-soft-xl)",
                      maxWidth: "640px",
                    }}
                  >

                    {/* Highlight overlay (interaction) */}
                    <div
                      className={`
                        absolute inset-0 pointer-events-none
                        transition-opacity duration-300
                        ${isActive ? "opacity-100" : "opacity-0"}
                      `}
                      style={{
                        background:
                          "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.18), transparent 60%)",
                      }}
                    />

                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/10" />

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
      </div>
    </section>
  );
};

export default SolutionSection;