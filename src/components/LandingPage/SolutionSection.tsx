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
    <section className="section-lg section-alt relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none"></div>

      <div className="container-wide">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto stack-md">

          <h2 className="text-[34px] md:text-[40px] font-semibold leading-tight text-main tracking-tight">
            One system to run your entire business — clearly and efficiently
          </h2>

          <p className="text-[15px] text-muted leading-relaxed">
            No more juggling tools or fixing mistakes. Everything works together seamlessly in one place.
          </p>

        </div>

        {/* STORY BLOCKS */}
        <div className="mt-20 space-y-24">

          {features.map((feature, index) => {
            const isReverse = index % 2 !== 0;

            return (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-16 items-center`}
              >

                {/* IMAGE SIDE */}
                <div className={`${isReverse ? "lg:order-2" : ""}`}>

                  <div className="relative group">

                    {/* Glow */}
                    <div
                      className="absolute inset-0 blur-3xl rounded-[32px] opacity-20"
                      style={{ background: "var(--gradient-primary)" }}
                    />

                    {/* Main Image */}
                    <div className="relative overflow-hidden rounded-[28px] border border-theme bg-surface-2 shadow-soft-xl">

                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-[300px] md:h-[360px] object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      />

                      {/* UI Highlight Overlay */}
                      <div className="absolute top-6 left-6 w-24 h-16 border-2 border-white/80 rounded-lg backdrop-blur-sm bg-white/10"></div>

                      {/* Arrow Indicator */}
                      <div className="absolute bottom-6 right-6 text-white text-[12px] bg-black/40 px-3 py-1 rounded-full backdrop-blur">
                        Live Data →
                      </div>

                    </div>

                  </div>

                </div>

                {/* TEXT SIDE */}
                <div className={`stack-md ${isReverse ? "lg:order-1" : ""}`}>

                  <p className="text-[12px] font-semibold text-primary tracking-wide uppercase">
                    {feature.label}
                  </p>

                  <h3 className="text-[26px] md:text-[30px] font-semibold text-main leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-[15px] text-muted leading-relaxed max-w-[520px]">
                    {feature.desc}
                  </p>

                  {feature.points && (
                    <ul className="stack-sm pt-3">

                      {feature.points.map((point, i) => (
                        <li
                          key={i}
                          className="text-[14px] text-main flex items-center gap-3"
                        >
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            ✓
                          </span>
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
    </section>
  );
};

export default SolutionSection;