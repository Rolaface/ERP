import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "Earlier, we were managing everything in Excel and WhatsApp. Payments were always confusing. Now everything is crystal clear in one place.",
    name: "Amit Sharma",
    role: "Pharma Distributor · Delhi",
    icon: "AS",
    featured: true,
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

const SmallCard = ({ t }: any) => (
  <div className="group relative flex-shrink-0 w-[280px] md:w-[320px]">

    <div className="rounded-xl bg-card border border-theme p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">

      {/* Stars */}
      <div className="flex mb-3 text-primary">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} fill="currentColor" />
        ))}
      </div>

      {/* Text */}
      <p className="text-[13px] text-main leading-relaxed mb-4">
        “{t.text}”
      </p>

      {/* User */}
      <div className="flex items-center gap-3">

        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--row-hover)] text-[11px] font-semibold">
          {t.icon}
        </div>

        <div>
          <p className="text-[12px] font-medium text-main">{t.name}</p>
          <p className="text-[11px] text-muted">{t.role}</p>
        </div>

      </div>
    </div>
  </div>
);

const TestimonialsSection: React.FC = () => {
  const featured = testimonials.find(t => t.featured);
  const normal = testimonials.filter(t => !t.featured);

  return (
    <section className="section section-default relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_60%)] pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[32px] md:text-[40px] font-semibold text-main leading-snug tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              growing businesses
            </span>
          </h2>

          <p className="text-body text-muted">
            Businesses like yours are simplifying operations, saving time, and gaining full control.
          </p>

        </div>

        {/* 🔥 FEATURED (EDITORIAL STYLE) */}
        {featured && (
          <div className="mt-[calc(var(--density-gap)*4)] max-w-3xl mx-auto">

            <div className="relative rounded-2xl bg-card border border-theme p-8 md:p-10 shadow-lg">

              {/* Quote Mark */}
              <div className="absolute -top-4 left-6 text-[60px] text-primary/10 font-serif select-none">
                “
              </div>

              {/* Stars */}
              <div className="flex mb-4 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              {/* Text */}
              <p className="text-[16px] md:text-[18px] text-main leading-relaxed mb-6 relative z-10">
                {featured.text}
              </p>

              {/* User */}
              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--row-hover)] text-[13px] font-semibold">
                  {featured.icon}
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-main">
                    {featured.name}
                  </p>
                  <p className="text-[13px] text-muted">
                    {featured.role}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* EDGE FADE */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />

      {/* 🎯 SINGLE CLEAN CAROUSEL */}
      <div className="overflow-hidden mt-[calc(var(--density-gap)*4)]">
        <div className="flex gap-[var(--density-gap)] w-max animate-marquee hover:[animation-play-state:paused]">
          {[...normal, ...normal].map((t, i) => (
            <SmallCard key={i} t={t} />
          ))}
        </div>
      </div>

      {/* TRUST LINE */}
      <div className="text-center mt-[calc(var(--density-gap)*5)] animate-fade-in">

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-full shadow-sm">

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

          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }

          .animate-marquee {
            animation: marquee 26s linear infinite;
          }
        `}
      </style>
    </section>
  );
};

export default TestimonialsSection;