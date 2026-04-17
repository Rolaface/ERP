import React, { useEffect, useRef } from "react";

const HeroSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Subtle Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 40;
      const y = (e.clientY - innerHeight / 2) / 40;

      imageRef.current.style.transform = `
        perspective(1200px)
        rotateY(${x * 0.3}deg)
        rotateX(${-y * 0.3}deg)
        scale(1.03)
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

      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
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
    <section className="section section-default relative overflow-hidden">

      {/* 🌌 PREMIUM BACKGROUND */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-subtle opacity-40 pointer-events-none"></div>

      <div className="container-app">
        <div className="hero-layout items-center">

          {/* LEFT */}
          <div className="max-w-[640px] stack-lg">

            {/* Badge */}
            <div className="badge bg-white/60 backdrop-blur-md border border-white/30">
              Trusted by 500+ growing businesses
            </div>

            {/* 🔥 HEADLINE */}
            <h1 className="text-[34px] md:text-[46px] lg:text-[56px] font-semibold leading-tight tracking-tight text-main">
              Run your entire business{" "}
              <span className="text-gradient">from one powerful dashboard</span>
              <br />
              without chaos
            </h1>

            {/* Subheadline */}
            <p className="text-muted text-[17px] max-w-[520px] leading-relaxed">
              Manage inventory, sales, and operations in one place — built for modern distributors and trading businesses.
            </p>

            {/* CTA */}
            <div className="flex items-center gap-4 flex-wrap mt-3">

              {/* Primary CTA */}
              <button
                ref={buttonRef}
                className="btn btn-primary relative overflow-hidden"
              >
                <span className="relative z-10">Start Free Trial →</span>
              </button>

              {/* Secondary CTA */}
              <button className="btn btn-ghost border border-theme hover:bg-white/40 backdrop-blur-md">
                See Live Demo
              </button>
            </div>

            {/* Trust */}
            <div className="flex items-center gap-5 text-[13px] text-muted mt-2">
              <span>✔ No credit card required</span>
              <span>✔ Setup in minutes</span>
            </div>

          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0">

            {/* Floating Glow Shapes */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float-premium"></div>
            <div className="absolute bottom-0 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-float-delayed"></div>

            {/* Image Wrapper */}
            <div
              ref={imageRef}
              className="relative transition-transform duration-200 w-full max-w-[600px]"
            >
              {/* Glow Behind Image */}
              <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-10 blur-3xl rounded-[28px]"></div>

              {/* Image */}
              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="relative w-full rounded-[28px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;