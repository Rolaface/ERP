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

      {/* Background */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-subtle opacity-40 pointer-events-none"></div>

      <div className="container-app">
        <div className="hero-layout items-center">

          {/* LEFT */}
          <div className="max-w-[640px] stack-lg">

            {/* Badge */}
            <div className="badge glass">
              Trusted by 500+ growing businesses
            </div>

            {/* HEADLINE */}
            <h1 className="text-[34px] md:text-[46px] lg:text-[56px] font-semibold leading-tight tracking-tight text-main">
              Run your entire business{" "}
              <span
                className="inline-block"
                style={{
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                from one powerful dashboard
              </span>
              <br />
              without chaos
            </h1>

            {/* Subheadline */}
            <p className="text-muted text-[17px] max-w-[520px] leading-relaxed">
              Manage inventory, sales, and operations in one place — built for modern distributors and trading businesses.
            </p>

            {/* CTA */}
            <div className="flex items-center gap-4 flex-wrap mt-3">

              {/* Primary CTA (FORCED TOKEN USAGE) */}
              <button
                ref={buttonRef}
                className="btn relative overflow-hidden"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--glow-primary)",
                  color: "#fff",
                  border: "none",
                }}
              >
                <span className="relative z-10">Start Free Trial →</span>
              </button>

              {/* Secondary CTA */}
              <button className="btn btn-ghost border border-theme backdrop-blur-md hover:bg-[var(--row-hover)]">
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

            {/* Glow Shapes */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl animate-float-premium"
              style={{ background: "var(--gradient-primary)", opacity: 0.2 }}
            />
            <div className="absolute bottom-0 -left-10 w-24 h-24 rounded-full blur-2xl animate-float-delayed"
              style={{ background: "var(--gradient-accent)", opacity: 0.3 }}
            />

            {/* Image */}
            <div
              ref={imageRef}
              className="relative transition-transform duration-200 w-full max-w-[600px]"
            >
              <div
                className="absolute inset-0 blur-3xl rounded-[28px]"
                style={{ background: "var(--gradient-primary)", opacity: 0.1 }}
              />

              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="relative w-full rounded-[28px] border border-theme"
                style={{ boxShadow: "var(--shadow-soft-xl)" }}
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;