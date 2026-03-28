import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "Earlier we were managing everything in Excel. Payments were always confusing. Now everything is clear in one place.",
    name: "Pharma Distributor",
    role: "Delhi",
    icon: "PD",
  },
  {
    text: "This ERP saved our accounting team hours every week.",
    name: "Trading Business Owner",
    role: "",
    icon: "TB",
  },
  {
    text: "Very simple UI. My team learned it in one day.",
    name: "Operations Manager",
    role: "",
    icon: "OM",
  },
  {
    text: "Inventory and accounting finally feel connected. Huge time saver.",
    name: "Distributor",
    role: "",
    icon: "DS",
  },
];

const Card = ({ t }: any) => (
  <div className="w-[320px] md:w-[360px] flex-shrink-0 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
    {/* Stars */}
    <div className="flex mb-4 text-amber-500">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} fill="currentColor" />
      ))}
    </div>

    {/* Text */}
    <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">
      “{t.text}”
    </p>

    {/* User */}
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-300 flex items-center justify-center text-white font-bold text-sm">
        {t.icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm md:text-base">
          {t.name}
        </p>
        {t.role && (
          <p className="text-xs text-gray-500">{t.role}</p>
        )}
      </div>
    </div>
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="relative py-28 bg-gradient-to-b from-white to-gray-50 overflow-hidden">

      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-20 px-6">
        

        <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
          Trusted by{" "}
          <span className="bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
            growing businesses
          </span>
        </h2>

        <p className="mt-6 text-lg text-gray-500">
          Real stories from businesses simplifying operations
        </p>
      </div>

      {/* GRADIENT EDGES */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white to-transparent z-10" />

      {/* ROW 1 (LEFT → RIGHT) */}
      <div className="overflow-hidden mb-8">
        <div className="flex gap-6 w-max animate-marquee-fast hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>

      {/* ROW 2 (RIGHT → LEFT) */}
      <div className="overflow-hidden">
        <div className="flex gap-6 w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        @keyframes marquee-fast {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-slow {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .animate-marquee-fast {
          animation: marquee-fast 20s linear infinite;
        }

        .animate-marquee-slow {
          animation: marquee-slow 28s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default Testimonials;