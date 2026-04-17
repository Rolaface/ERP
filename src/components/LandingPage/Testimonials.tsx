import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "Earlier, we were managing everything in Excel and WhatsApp. Payments were always confusing. Now everything is crystal clear in one place.",
    name: "Amit Sharma",
    role: "Pharma Distributor · Delhi",
    icon: "AS",
  },
  {
    text: "This ERP saved our accounting team 10+ hours every week. Reconciliation is no longer a headache.",
    name: "Neha Gupta",
    role: "Trading Business Owner",
    icon: "NG",
  },
  {
    text: "The UI is so simple that my team got comfortable within a day. No training needed.",
    name: "Rohit Jain",
    role: "Operations Manager",
    icon: "RJ",
  },
  {
    text: "Inventory and accounting finally feel connected. We make faster decisions now.",
    name: "Vikas Agarwal",
    role: "Distributor",
    icon: "VA",
  },
];

const Card = ({ t }: any) => (
  <div className="w-[300px] md:w-[340px] flex-shrink-0 bg-white border border-theme rounded-[calc(var(--density-radius)*1.5)] p-[calc(var(--density-gap)*2)] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">

    {/* Stars */}
    <div className="flex mb-4 text-[var(--primary)]">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} fill="currentColor" />
      ))}
    </div>

    {/* Text */}
    <p className="text-[14px] text-main leading-relaxed mb-6">
      “{t.text}”
    </p>

    {/* User */}
    <div className="flex items-center gap-3">

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[var(--row-hover)] flex items-center justify-center text-[12px] font-semibold text-main">
        {t.icon}
      </div>

      {/* Info */}
      <div>
        <p className="text-[13px] font-semibold text-main">
          {t.name}
        </p>
        <p className="text-[12px] text-muted">
          {t.role}
        </p>
      </div>

    </div>
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="section section-default relative overflow-hidden">

      {/* Background Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[32px] md:text-[38px] font-semibold text-main leading-snug">
            Loved by{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              growing businesses
            </span>
          </h2>

          <p className="text-body text-muted">
            Businesses like yours are simplifying operations, saving time, and gaining full control.
          </p>

        </div>

      </div>

      {/* GRADIENT EDGES */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />

      {/* ROW 1 */}
      <div className="overflow-hidden mt-[calc(var(--density-gap)*4)]">
        <div className="flex gap-[var(--density-gap)] w-max animate-marquee-fast hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>

      {/* ROW 2 */}
      <div className="overflow-hidden mt-[var(--density-gap)]">
        <div className="flex gap-[var(--density-gap)] w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>

      {/* TRUST LINE */}
      <div className="text-center mt-[calc(var(--density-gap)*4)] animate-fade-in">

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-full">
          <p className="text-[13px] text-muted">
            Join 500+ businesses already running smarter operations
          </p>
        </div>

      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeIn 0.6s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes marquee-fast {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }

          @keyframes marquee-slow {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }

          .animate-marquee-fast {
            animation: marquee-fast 22s linear infinite;
          }

          .animate-marquee-slow {
            animation: marquee-slow 30s linear infinite;
          }
        `}
      </style>
    </section>
  );
};

export default Testimonials;