import React, { useEffect, useState } from "react";

/* Simple Counter Hook */
const useCounter = (end: number, duration = 1200) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return count;
};

const SocialProof: React.FC = () => {
  const rating = useCounter(48); // 4.8 → 48
  const revenue = useCounter(100);
  const users = useCounter(500);

  return (
    <section className="section relative overflow-hidden section-glow border-y border-theme">

      {/* 🌌 Background Layer */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none"></div>

      <div className="container-app text-center stack-lg">

        {/* TOP TEXT */}
        <div className="max-w-2xl mx-auto stack-sm">

          <p className="text-[12px] text-muted font-medium tracking-wide">
            Trusted by 500+ businesses across India
          </p>

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Powering modern distributors, pharma companies
            <br className="hidden md:block" />
            & trading businesses
          </h2>

        </div>

        {/* LOGO STRIP (UPGRADED) */}
        <div className="relative">

          {/* Glow Background */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-xl border border-white/30"></div>

          <div className="relative flex flex-wrap justify-center items-center gap-x-12 gap-y-5 py-6 opacity-80">

            {[
              "PharmaCore",
              "TradeLogic",
              "IndDistro",
              "MedLink",
              "SupplyPro",
            ].map((logo, i) => (
              <div
                key={i}
                className="text-[15px] font-medium text-muted tracking-tight transition-all duration-300 hover:text-main hover:scale-110"
              >
                {logo}
              </div>
            ))}

          </div>
        </div>

        {/* 🔥 METRICS STRIP */}
        <div className="grid md:grid-cols-3 gap-6 mt-10">

          {/* Metric 1 */}
          <div className="card-premium text-center py-8">
            <p className="text-[40px] font-semibold text-gradient">
              {(rating / 10).toFixed(1)}
            </p>
            <p className="text-[12px] text-muted mt-2">
              Average rating
            </p>
          </div>

          {/* Metric 2 */}
          <div className="card-premium text-center py-8">
            <p className="text-[40px] font-semibold text-gradient">
              {revenue}Cr+
            </p>
            <p className="text-[12px] text-muted mt-2">
              Transactions yearly
            </p>
          </div>

          {/* Metric 3 */}
          <div className="card-premium text-center py-8">
            <p className="text-[40px] font-semibold text-gradient">
              {users}+
            </p>
            <p className="text-[12px] text-muted mt-2">
              Active businesses
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SocialProof;