import React, { useEffect, useRef } from "react";

const HeroSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Subtle Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 50;
      const y = (e.clientY - innerHeight / 2) / 50;

      imageRef.current.style.transform = `
        perspective(1200px)
        rotateY(${x * 0.25}deg)
        rotateX(${-y * 0.25}deg)
        scale(1.02)
      `;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Magnetic CTA
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    };

    const reset = () => {
      btn.style.transform = "translate(0px, 0px)";
    };

    btn.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", reset);

    return () => {
      btn.removeEventListener("mousemove", handleMove);
      btn.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <section className="section section-default overflow-hidden">
      <div className="container-app">

        {/* ⚖️ BALANCED GRID */}
        <div className="grid lg:grid-cols-2 items-center gap-[calc(var(--density-gap)*2.5)]">

          {/* LEFT */}
          <div className="max-w-[600px] stack-md">

            <div className="badge">
              Trusted by 500+ growing businesses
            </div>

            {/* Balanced Headline */}
            <h1 className="leading-tight font-semibold text-[30px] md:text-[38px] lg:text-[44px] tracking-tight">
              Run your entire business
              <br />
              from one dashboard —
              <br />
              <span className="text-primary">
                without chaos or spreadsheets
              </span>
            </h1>

            <p className="text-[15px] text-muted leading-relaxed">
              Manage inventory, sales, accounting, and operations in one simple system.
              Built for businesses that want clarity, speed, and control.
            </p>

            <div className="flex items-center gap-[var(--density-gap)] flex-wrap">

              <button
                ref={buttonRef}
                className="btn btn-primary shadow-sm hover:shadow-md"
              >
                Start Free — No Setup Needed
              </button>

              <button className="btn btn-outline">
                See Live Demo
              </button>
            </div>

            <p className="text-[12px] text-muted">
              No credit card required • Setup in under 5 minutes
            </p>

          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end">

            <div
              ref={imageRef}
              className="transition-transform duration-200 w-full max-w-[540px]"
            >
              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="w-full rounded-[calc(var(--density-radius)*2)] shadow-xl border border-theme"
              />
            </div>

            {/* Soft Glow */}
            <div className="absolute -z-10 w-[80%] h-[80%] blur-3xl opacity-10 bg-primary rounded-full"></div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;