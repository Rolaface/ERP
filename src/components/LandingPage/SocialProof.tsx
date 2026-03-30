import React from "react";

const SocialProof: React.FC = () => {
  return (
    <section className="section section-alt border-y border-theme">

      <div className="container-app text-center stack-lg">

        {/* TOP TEXT */}
        <div className="max-w-2xl mx-auto stack-sm">

          <p className="text-[12px] text-muted font-medium">
            Trusted by 500+ businesses across India
          </p>

          <h2 className="text-[28px] md:text-[32px] font-semibold leading-snug text-main">
            Powering modern distributors, pharma companies
            <br className="hidden md:block" />
            & trading businesses
          </h2>

        </div>

        {/* LOGOS (PREMIUM STYLE) */}
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
              className="text-[15px] font-medium text-muted tracking-tight hover:text-main transition-colors"
            >
              {logo}
            </div>
          ))}

        </div>

        {/* METRICS (CLEAN + PREMIUM) */}
        <div className="flex flex-col md:flex-row items-center justify-center mt-[calc(var(--density-gap)*2)]">

          {/* Metric 1 */}
          <div className="px-6 py-4 text-center">
            <p className="text-[26px] font-semibold text-main">4.8/5</p>
            <p className="text-[12px] text-muted mt-1">
              Average rating
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-10 w-px bg-[var(--border)]"></div>

          {/* Metric 2 */}
          <div className="px-6 py-4 text-center">
            <p className="text-[26px] font-semibold text-main">₹100Cr+</p>
            <p className="text-[12px] text-muted mt-1">
              Transactions yearly
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-10 w-px bg-[var(--border)]"></div>

          {/* Metric 3 */}
          <div className="px-6 py-4 text-center">
            <p className="text-[26px] font-semibold text-main">500+</p>
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