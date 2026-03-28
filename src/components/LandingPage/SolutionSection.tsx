import React from "react";

type Feature = {
  label: string;
  title: string;
  desc: string;
  points?: string[];
  image: string;
};

const features: Feature[] = [
  {
    label: "Payments",
    title: "Never lose track of your payments again",
    desc: "Track supplier & customer payments across multiple modes with complete visibility into your cash flow.",
    points: ["Cash, bank & card support", "Real-time payment tracking"],
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format",
  },
  {
    label: "Accounting",
    title: "Real-time accounting, always accurate",
    desc: "Every transaction is automatically recorded. No manual reconciliation needed.",
    points: ["0 manual entries", "Always audit-ready"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format",
  },
  {
    label: "Inventory",
    title: "Know exactly what’s in stock",
    desc: "Real-time inventory tracking so you never overstock or run out.",
    points: ["Multi-location tracking", "Smart reorder alerts"],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format",
  },
  {
    label: "Sales",
    title: "Track every order from start to finish",
    desc: "Manage your full sales and procurement cycle in one place.",
    points: ["End-to-end tracking", "Live order updates"],
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format",
  },
  {
    label: "Permissions",
    title: "Control who sees what",
    desc: "Assign roles and restrict access to keep your data secure.",
    points: ["Role-based access", "Team-level control"],
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format",
  },
  {
    label: "Usability",
    title: "Simple enough for your entire team",
    desc: "Clean interface designed for speed — no training required.",
    points: ["Minimal learning curve", "Fast navigation"],
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1600&auto=format",
  },
];

const SolutionSection: React.FC = () => {
  return (
    <section className="w-full bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-24 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
            One ERP to run your entire business smoothly
          </h2>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Manage payments, inventory, sales, and accounting — all in one place.
          </p>
        </div>

        {/* FEATURES */}
        <div className="space-y-32">
          {features.map((feature, index) => {
            const isReverse = index % 2 !== 0;

            return (
              <div
                key={index}
                className="grid md:grid-cols-2 gap-16 items-center"
              >
                {/* IMAGE */}
                <div
                  className={`relative ${
                    isReverse
                      ? "md:order-2 animate-slide-right"
                      : "md:order-1 animate-slide-left"
                  }`}
                >
                  <div className="group relative w-full h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    
                    {/* IMAGE */}
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[1deg]"
                    />

                    {/* GRADIENT OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />

                    {/* SHINE EFFECT */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="shine absolute top-0 left-[-100%] w-[50%] h-full bg-white/20 blur-xl rotate-12"></div>
                    </div>
                  </div>
                </div>

                {/* TEXT */}
                <div
                  className={`space-y-6 ${
                    isReverse
                      ? "md:order-1 animate-slide-left"
                      : "md:order-2 animate-slide-right"
                  }`}
                >
                  <p className="text-xs tracking-[0.2em] uppercase text-[#c58b45] font-semibold">
                    {feature.label}
                  </p>

                  <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>

                  {feature.points && (
                    <ul className="space-y-2 pt-2">
                      {feature.points.map((point, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-[#c58b45] rounded-full" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
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

          .animate-slide-left {
            opacity: 0;
            transform: translateX(-30px);
            animation: slideLeft 0.6s ease forwards;
          }

          .animate-slide-right {
            opacity: 0;
            transform: translateX(30px);
            animation: slideRight 0.6s ease forwards;
          }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideLeft {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideRight {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* FLOATING EFFECT */
          .group img {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }

          /* SHINE ANIMATION */
          .group:hover .shine {
            animation: shineMove 0.9s ease forwards;
          }

          @keyframes shineMove {
            100% {
              left: 120%;
            }
          }
        `}
      </style>
    </section>
  );
};

export default SolutionSection;