import React, { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "Before this, we were managing everything in Excel and WhatsApp. Payments were always confusing. Now everything is crystal clear in one place.",
    highlight: "everything is crystal clear in one place",
    name: "Amit Sharma",
    role: "Pharma Distributor · Delhi",
    icon: "AS",
    featured: true,
    size: "25+ employees",
    volume: "1200+ invoices/month",
    tag: "Visibility",
  },
  {
    text: "Before using this, reconciliation took hours. Now this ERP saved our accounting team 10+ hours every week.",
    highlight: "10+ hours every week",
    name: "Neha Gupta",
    role: "Trading Business Owner",
    icon: "NG",
    size: "12+ employees",
    volume: "800+ invoices/month",
    tag: "Time Saving",
  },
  {
    text: "Earlier, training new staff was painful. Now the team got comfortable within a day — no training needed.",
    highlight: "comfortable within a day",
    name: "Rohit Jain",
    role: "Operations Manager",
    icon: "RJ",
    size: "18+ employees",
    volume: "600+ invoices/month",
    tag: "Simplicity",
  },
  {
    text: "Before, inventory and accounting were disconnected. Now they finally feel connected and we make faster decisions.",
    highlight: "finally feel connected",
    name: "Vikas Agarwal",
    role: "Distributor",
    icon: "VA",
    size: "30+ employees",
    volume: "1500+ invoices/month",
    tag: "Accuracy",
  },
];

// highlight helper
const renderHighlightedText = (text: string, highlight?: string) => {
  if (!highlight) return text;
  const parts = text.split(highlight);
  return (
    <>
      {parts[0]}
      <span className="text-main font-semibold bg-primary/10 px-1 rounded">
        {highlight}
      </span>
      {parts[1]}
    </>
  );
};

// 🔊 tiny voice waveform
const VoiceWave = () => (
  <div className="flex items-end gap-[2px] h-3">
    {[...Array(5)].map((_, i) => (
      <span
        key={i}
        className="w-[2px] bg-primary/70 rounded animate-wave"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

const SmallCard = ({ t }: any) => (
  <div className="group relative flex-shrink-0 w-[280px] md:w-[320px]">

    <div className="rounded-xl bg-card border border-theme p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">

      {/* Stars */}
      <div className="flex mb-3 text-primary opacity-80">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} fill="currentColor" />
        ))}
      </div>

      {/* Text */}
      <p className="text-[14px] text-main leading-relaxed mb-5">
        “{renderHighlightedText(t.text, t.highlight)}”
      </p>

      {/* Credibility */}
      <div className="flex flex-wrap gap-2 mb-4 text-[10px] text-muted">
        <span className="px-2 py-[2px] bg-surface-2 rounded">{t.size}</span>
        <span className="px-2 py-[2px] bg-surface-2 rounded">{t.volume}</span>
      </div>

      {/* User */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--row-hover)] text-[11px] font-medium">
            {t.icon}
          </div>

          <div>
            <p className="text-[12px] font-medium text-main">{t.name}</p>
            <p className="text-[11px] text-muted">{t.role}</p>
          </div>
        </div>

        {/* Voice hint */}
        <div className="opacity-0 group-hover:opacity-100 transition">
          <VoiceWave />
        </div>

      </div>
    </div>
  </div>
);

const TestimonialsSection: React.FC = () => {
  const featured = testimonials.find(t => t.featured);
  const normal = testimonials.filter(t => !t.featured);

  const sectionRef = useRef<HTMLDivElement>(null);
  const [pause, setPause] = useState(false);

  // 🎯 Pause marquee when centered
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      const centered = rect.top < vh * 0.5 && rect.bottom > vh * 0.5;
      setPause(centered);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section section-default relative overflow-hidden"
    >

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_60%)] pointer-events-none"></div>

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[34px] md:text-[42px] font-semibold text-main leading-snug tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              growing businesses
            </span>
          </h2>

          <p className="text-body text-muted">
            Proven across workflows — saving time, improving accuracy, and giving full visibility.
          </p>

        </div>

        {/* 🔥 FEATURED */}
        {featured && (
          <div className="mt-[calc(var(--density-gap)*4)] max-w-3xl mx-auto">

            <div className="relative rounded-2xl bg-card border border-theme p-10 md:p-12 shadow-lg">

              <div className="flex mb-6 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>

              <p className="text-[18px] md:text-[20px] text-main leading-relaxed mb-8">
                {renderHighlightedText(featured.text, featured.highlight)}
              </p>

              {/* Credibility */}
              <div className="flex gap-3 mb-6 text-[11px] text-muted">
                <span className="px-3 py-1 bg-surface-2 rounded">{featured.size}</span>
                <span className="px-3 py-1 bg-surface-2 rounded">{featured.volume}</span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded">
                  {featured.tag}
                </span>
              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--row-hover)] text-[14px] font-semibold">
                    {featured.icon}
                  </div>

                  <div>
                    <p className="text-[15px] font-semibold text-main">
                      {featured.name}
                    </p>
                    <p className="text-[13px] text-muted">
                      {featured.role}
                    </p>
                  </div>
                </div>

                <VoiceWave />

              </div>

            </div>

          </div>
        )}

      </div>

      {/* CAROUSEL */}
      <div className="overflow-hidden mt-[calc(var(--density-gap)*4)]">
        <div
          className={`flex gap-[var(--density-gap)] w-max animate-marquee ${
            pause ? "[animation-play-state:paused]" : ""
          }`}
        >
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

          @keyframes wave {
            0%, 100% { height: 4px; }
            50% { height: 12px; }
          }

          .animate-wave {
            animation: wave 1s ease-in-out infinite;
          }
        `}
      </style>
    </section>
  );
};

export default TestimonialsSection;