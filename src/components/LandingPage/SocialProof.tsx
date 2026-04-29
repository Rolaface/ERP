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

  // 👇 Trigger animation on scroll (IntersectionObserver)
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

  // Counters (start only when visible)
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
        <div className="max-w-2xl mx-auto stack-sm">
          <p className="text-[11px] text-muted font-semibold tracking-[0.12em] uppercase">
            Trusted across India
          </p>

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Powering modern distributors, pharma companies
            <br className="hidden md:block" />
            & trading businesses
          </h2>
        </div>

        {/* LOGO STRIP (SVG logos, grayscale → hover) */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-xl border border-white/30"></div>

          <div className="relative flex flex-wrap justify-center items-center gap-x-12 gap-y-6 py-6">

            {["logo1.svg", "logo2.svg", "logo3.svg", "logo4.svg", "logo5.svg"].map((logo, i) => (
              <img
                key={i}
                src={`/logos/${logo}`}
                alt="brand"
                className="h-6 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-105"
              />
            ))}

          </div>
        </div>

        {/* METRICS */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-theme/60">

          {/* Metric 1 */}
          <div
            className="flex-1 py-6 px-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            style={{ transitionDelay: "0ms" }}
          >
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
              Average rating
            </p>

            <p className="text-[42px] font-semibold text-main">
              {(rating / 10).toFixed(1)}
            </p>

            <p className="text-[12px] text-muted mt-1">
              based on Google Reviews
            </p>
          </div>

          {/* Metric 2 */}
          <div
            className="flex-1 py-6 px-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            style={{ transitionDelay: "60ms" }}
          >
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
              Transactions yearly
            </p>

            <p className="text-[42px] font-semibold text-main">
              ₹{revenue}Cr+
            </p>

            <p className="text-[12px] text-muted mt-1">
              processed annually
            </p>
          </div>

          {/* Metric 3 */}
          <div
            className="flex-1 py-6 px-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            style={{ transitionDelay: "120ms" }}
          >
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
              Active businesses
            </p>

            <p className="text-[42px] font-semibold text-main">
              {users}+
            </p>

            <p className="text-[12px] text-muted mt-1">
              using daily operations
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SocialProof;