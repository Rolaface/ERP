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
    <section className="section section-default relative overflow-hidden">
      
      {/* Background Gradient Enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>

      <div className="container-app">

        {/* Layout Upgrade */}
        <div className="hero-layout items-center">

          {/* LEFT */}
          <div className="max-w-[640px] stack-lg">

            <div className="badge">
              Trusted by 500+ growing businesses
            </div>

            {/* Headline Upgrade */}
            <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-semibold text-main leading-tight tracking-tight">
              Run your entire business <br />
              from one powerful dashboard{" "}
              <span className="text-primary">without chaos</span>
            </h1>

            {/* Sharper Subheadline */}
            <p className="text-muted text-[16px] max-w-[520px] leading-relaxed">
              Manage inventory, sales, and operations in one place — built for modern distributors and trading businesses.
            </p>

            {/* CTA Section */}
            <div className="flex items-center gap-[var(--density-gap)] flex-wrap mt-2">

              <button
                ref={buttonRef}
                className="btn btn-primary shadow-md"
              >
                Start Free Trial →
              </button>

              <button className="btn btn-outline">
                See Live Demo
              </button>
            </div>

            {/* Trust Signal */}
            <div className="flex items-center gap-4 text-[13px] text-muted">
              <span>✔ No credit card required</span>
              <span>✔ Setup in minutes</span>
            </div>

          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-xl animate-float"></div>
            <div className="absolute bottom-0 -left-6 w-16 h-16 bg-primary/10 rounded-xl animate-float-delayed"></div>

            {/* Premium Image Wrapper */}
            <div
              ref={imageRef}
              className="relative transition-transform duration-200 w-full max-w-[560px]"
            >
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-[calc(var(--density-radius)*2)]"></div>

              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="relative w-full rounded-[calc(var(--density-radius)*2)] shadow-xl border border-theme motion-hover-lift"
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;