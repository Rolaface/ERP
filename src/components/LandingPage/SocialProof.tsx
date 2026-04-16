import React from "react";

const SocialProof: React.FC = () => {
  return (
    <section className="section section-alt border-y border-theme relative overflow-hidden">

      {/* Subtle Background Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>

      <div className="container-app text-center stack-lg">

        {/* TOP TEXT */}
        <div className="max-w-2xl mx-auto stack-sm">

          <p className="text-[12px] text-muted font-medium tracking-wide">
            Trusted by 500+ businesses across India
          </p>

          <h2 className="text-[28px] md:text-[34px] font-semibold leading-snug text-main">
            Powering modern distributors, pharma companies
            <br className="hidden md:block" />
            & trading businesses
          </h2>

        </div>

        {/* LOGOS (UPGRADED HOVER + DEPTH) */}
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-70">

          {[
            "PharmaCore",
            "TradeLogic",
            "IndDistro",
            "MedLink",
            "SupplyPro",
          ].map((logo, i) => (
            <div
              key={i}
              className="text-[15px] font-medium text-muted tracking-tight transition-all duration-300 hover:text-main hover:scale-105"
            >
              {logo}
            </div>
          ))}

        </div>

        {/* METRICS (PREMIUM CARD STYLE) */}
        <div className="grid md:grid-cols-3 gap-[var(--density-gap)] mt-[calc(var(--density-gap)*2)]">

          {/* Metric 1 */}
          <div className="card card-hover text-center py-6">
            <p className="text-[28px] font-semibold text-main">4.8/5</p>
            <p className="text-[12px] text-muted mt-1">
              Average rating
            </p>
          </div>

          {/* Metric 2 */}
          <div className="card card-hover text-center py-6">
            <p className="text-[28px] font-semibold text-main">₹100Cr+</p>
            <p className="text-[12px] text-muted mt-1">
              Transactions yearly
            </p>
          </div>

          {/* Metric 3 */}
          <div className="card card-hover text-center py-6">
            <p className="text-[28px] font-semibold text-main">500+</p>
            <p className="text-[12px] text-muted mt-1">
              Active businesses
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SocialProof;