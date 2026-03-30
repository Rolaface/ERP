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
    title: "Always know who paid and who hasn’t",
    desc: "Track every incoming and outgoing payment in one place — without switching tools.",
    points: ["Cash, bank & card tracking", "Real-time payment status"],
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format",
  },
  {
    label: "Accounting",
    title: "Accurate books without manual work",
    desc: "Every transaction is recorded automatically, keeping your accounts always up to date.",
    points: ["No manual entries", "Always audit-ready"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format",
  },
  {
    label: "Inventory",
    title: "Know exactly what’s in stock",
    desc: "Real-time inventory tracking helps you avoid stockouts and overstocking.",
    points: ["Multi-location tracking", "Smart reorder alerts"],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format",
  },
  {
    label: "Sales",
    title: "Track every order from start to finish",
    desc: "Manage your entire sales and purchase flow in one streamlined system.",
    points: ["End-to-end visibility", "Live order tracking"],
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format",
  },
];

const SolutionSection: React.FC = () => {
  return (
    <section className="section section-alt">

      <div className="container-app">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md animate-fade-in">

          <h2 className="text-[30px] md:text-[36px] font-semibold leading-snug text-main">
            Everything you need to run your business — in one place
          </h2>

          <p className="text-body text-muted">
            No more switching tools or fixing mismatched data. One system that keeps everything in sync.
          </p>

        </div>

        {/* FEATURES */}
        <div className="mt-[calc(var(--density-gap)*4)] space-y-[calc(var(--density-gap)*4)]">

          {features.map((feature, index) => {
            const isReverse = index % 2 !== 0;

            return (
              <div
                key={index}
                className={`grid md:grid-cols-2 items-center gap-[calc(var(--density-gap)*3)] animate-fade-up`}
                style={{ animationDelay: `${index * 0.12}s` }}
              >

                {/* IMAGE */}
                <div className={`${isReverse ? "md:order-2" : ""}`}>
                  <div className="group bg-card border border-theme rounded-[calc(var(--density-radius)*2)] overflow-hidden shadow-sm">

                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-[260px] md:h-[320px] object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />

                  </div>
                </div>

                {/* TEXT */}
                <div className={`stack-md ${isReverse ? "md:order-1" : ""}`}>

                  <p className="text-[12px] font-medium text-primary tracking-wide">
                    {feature.label}
                  </p>

                  <h3 className="text-[22px] md:text-[26px] font-semibold text-main leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-[14px] text-muted leading-relaxed max-w-[480px]">
                    {feature.desc}
                  </p>

                  {feature.points && (
                    <ul className="stack-sm pt-2">
                      {feature.points.map((point, i) => (
                        <li
                          key={i}
                          className="text-[13px] text-main flex items-center gap-2 transition-all duration-300 hover:translate-x-1"
                        >
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
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
            animation: fadeIn 0.6s ease forwards;
          }

          .animate-fade-up {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeUp 0.7s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeUp {
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

export default SolutionSection;