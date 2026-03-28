import React from "react";

const SocialProof: React.FC = () => {
  return (
    <section className="w-full bg-white border-t border-gray-200 py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        
        {/* TOP: TRUST TEXT */}
        <div className="mb-12 animate-fade-in">
          <p className="text-[11px] tracking-[0.25em] uppercase text-gray-400 font-semibold">
            Trusted by growing businesses
          </p>

          <h2 className="mt-4 text-xl md:text-2xl font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Used by 500+ distributors, pharma companies & trading businesses across India
          </h2>
        </div>

        {/* LOGO STRIP */}
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 mb-14">
          
          {[
            "PharmaCore",
            "TradeLogic",
            "IndDistro",
            "MedLink",
            "SupplyPro",
          ].map((logo, i) => (
            <div
              key={i}
              className="text-gray-400 font-semibold text-xl tracking-tight transition-all duration-300 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105 cursor-default"
            >
              {logo}
            </div>
          ))}
        </div>

        {/* METRICS */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-0 max-w-4xl mx-auto">
          
          {/* Metric 1 */}
          <div className="flex-1 flex flex-col items-center animate-fade-in">
            <p className="text-lg font-semibold text-gray-900">
              ⭐ 4.8/5
            </p>
            <p className="text-[11px] tracking-widest uppercase text-gray-400 mt-1">
              User Satisfaction
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-gray-200 mx-6" />

          {/* Metric 2 */}
          <div className="flex-1 flex flex-col items-center animate-fade-in delay-100">
            <p className="text-lg font-semibold text-gray-900">
              ₹100Cr+ Transactions
            </p>
            <p className="text-[11px] tracking-widest uppercase text-gray-400 mt-1">
              Processed Annually
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-gray-200 mx-6" />

          {/* Metric 3 */}
          <div className="flex-1 flex flex-col items-center animate-fade-in delay-200">
            <p className="text-lg font-semibold text-gray-900">
              500+ Businesses
            </p>
            <p className="text-[11px] tracking-widest uppercase text-gray-400 mt-1">
              Across India
            </p>
          </div>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease forwards;
          }

          .delay-100 {
            animation-delay: 0.1s;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
};

export default SocialProof;