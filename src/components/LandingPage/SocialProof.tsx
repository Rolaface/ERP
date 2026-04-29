import React, { useEffect, useRef, useState } from "react";

/* Counter Hook (controlled start) */
const useCounter = (end: number, start: boolean, duration = 1200) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startVal = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      startVal += increment;
      if (startVal >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(startVal));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, start]);

  return count;
};

const SocialProof: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartAnimation(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const rating = useCounter(48, startAnimation);
  const revenue = useCounter(100, startAnimation);
  const users = useCounter(500, startAnimation);

  return (
    <section
      ref={sectionRef}
      className="section relative overflow-hidden section-glow border-y border-theme"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none"></div>

      <div className="container-app text-center stack-lg">

        {/* TOP TEXT */}
        <div className="max-w-2xl mx-auto stack-sm motion-fade-up">
          <p className="text-[11px] text-muted font-semibold tracking-[0.12em] uppercase">
            Trusted across India
          </p>

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Powering modern distributors, pharma companies
            <br className="hidden md:block" />
            & trading businesses
          </h2>
        </div>

        {/* LOGO STRIP (auto-scroll for liveliness) */}
        <div className="relative mt-6 overflow-hidden">
          {/* Glass layer */}
          <div className="absolute inset-0 bg-card/60 backdrop-blur-xl rounded-xl border border-theme"></div>

          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[var(--bg)] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[var(--bg)] to-transparent z-10"></div>

          {/* Scrolling logos */}
          <div className="relative flex gap-12 py-6 animate-[scroll_25s_linear_infinite] whitespace-nowrap">
            {[...Array(2)].map((_, loop) =>
              ["logo1.svg", "logo2.svg", "logo3.svg", "logo4.svg", "logo5.svg"].map((logo, i) => (
                <img
                  key={`${loop}-${i}`}
                  src={`/logos/${logo}`}
                  alt="brand"
                  className="h-6 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-105"
                />
              ))
            )}
          </div>
        </div>

        {/* METRICS */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Metric Card */}
          {[
            {
              label: "Average rating",
              value: (rating / 10).toFixed(1),
              suffix: "",
              sub: "based on Google Reviews",
            },
            {
              label: "Transactions yearly",
              value: revenue,
              prefix: "₹",
              suffix: "Cr+",
              sub: "processed annually",
            },
            {
              label: "Active businesses",
              value: users,
              suffix: "+",
              sub: "using daily operations",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-xl border border-theme bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] motion-fade-up"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* subtle glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 rounded-xl"
                style={{
                  background: "var(--gradient-primary)",
                  filter: "blur(40px)",
                  opacity: 0.08,
                }}
              />

              <p className="text-[10px] tracking-[0.14em] uppercase text-muted mb-2 relative z-10">
                {item.label}
              </p>

              <p className="text-[40px] md:text-[44px] font-semibold text-main relative z-10">
                {item.prefix || ""}
                {item.value}
                {item.suffix || ""}
              </p>

              <p className="text-[12px] text-muted mt-1 relative z-10">
                {item.sub}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default SocialProof;