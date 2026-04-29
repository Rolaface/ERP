import React, { useEffect, useRef } from "react";

const HeroSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const state = useRef({
    mouseX: 0,
    mouseY: 0,
    scrollY: 0,
    hover: false,
  });

  // Motion loop
  useEffect(() => {
    let raf: number;

    const update = () => {
      const el = imageRef.current;
      if (!el) return;

      const { mouseX, mouseY, scrollY, hover } = state.current;

      const rotateX = hover ? -mouseY * 1.2 : -mouseY;
      const rotateY = hover ? mouseX * 1.2 : mouseX;

      const translateY = scrollY * -20;
      const scale = hover ? 1.06 : 1.045;

      el.style.transform = `
        perspective(1400px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(${translateY}px)
        scale(${scale})
      `;

      raf = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mouse lighting
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      state.current.mouseX = (e.clientX - innerWidth / 2) / 80;
      state.current.mouseY = (e.clientY - innerHeight / 2) / 80;

      if (lightRef.current) {
        lightRef.current.style.background = `
          radial-gradient(
            circle at ${e.clientX}px ${e.clientY}px,
            rgba(255,255,255,0.22),
            transparent 60%
          )
        `;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll depth
  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const vh = window.innerHeight;

      const progress = (vh - rect.top) / (vh + rect.height);
      state.current.scrollY = (progress - 0.5) * 1.2;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hover
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const isHoverCapable = window.matchMedia("(hover: hover)").matches;
    if (!isHoverCapable) return;

    const onEnter = () => (state.current.hover = true);
    const onLeave = () => (state.current.hover = false);

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Magnetic CTA (refined)
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    let raf: number;

    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();

        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.10}px, ${y * 0.10}px) scale(1.05)`;
      });
    };

    const reset = () => {
      btn.style.transform = "translate(0px, 0px) scale(1)";
    };

    btn.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", reset);

    return () => {
      cancelAnimationFrame(raf);
      btn.removeEventListener("mousemove", handleMove);
      btn.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <section className="section-lg section-default relative overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 bg-radial-glow opacity-70 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none"></div>

      <div className="container-app">
        <div className="hero-layout items-center gap-8 lg:gap-4">

          {/* LEFT */}
          <div className="container-narrow stack-lg">
            <div className="badge glass w-fit motion-fade-up">
              Trusted by 500+ growing businesses
            </div>

            {/* Improved headline */}
            <h1 className="max-w-[640px] text-[38px] md:text-[52px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight text-main motion-fade-up motion-delay-1">
              <div>Run your entire business</div>

              <div className="text-gradient font-semibold">
                from one powerful dashboard
              </div>

              <div className="text-muted text-[0.85em] font-medium">
                without chaos
              </div>
            </h1>

            <p className="text-muted text-[18px] max-w-[480px] leading-relaxed motion-fade-up motion-delay-2">
              Manage inventory, sales, and operations in one place — built for
              modern distributors and trading businesses.
            </p>

            <div className="flex items-center gap-4 flex-wrap mt-4 motion-fade-up motion-delay-3">
              <button
                ref={buttonRef}
                className="btn btn-premium relative overflow-hidden px-[calc(var(--density-padding-lg)+4px)] py-[calc(var(--density-padding-sm)+2px)]"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--glow-primary)",
                  color: "#fff",
                  border: "none",
                }}
              >
                <span className="relative z-10">Start Free Trial →</span>
              </button>

              <button className="btn btn-ghost border border-theme backdrop-blur-md hover:bg-[var(--row-hover)]">
                See Live Demo
              </button>
            </div>

            <div className="flex items-center gap-5 text-[13px] text-muted mt-2 motion-fade-up motion-delay-4">
              <span>✔ No credit card required</span>
              <span>✔ Setup in minutes</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0 overflow-visible">

            {/* Radial integration (NEW) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[520px] h-[520px] rounded-full blur-3xl"
                style={{
                  background: "var(--gradient-primary)",
                  opacity: 0.12,
                }}
              />
            </div>

            {/* Base shadow (NEW depth) */}
            <div className="absolute bottom-[-30px] w-[70%] h-[60px] bg-black/10 blur-2xl rounded-full"></div>

            {/* Floating ambient */}
            <div
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl animate-float-premium"
              style={{ background: "var(--gradient-primary)", opacity: 0.18 }}
            />

            {/* IMAGE */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[680px] animate-float transition-transform duration-300"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Lighting */}
              <div
                ref={lightRef}
                className="absolute inset-0 rounded-[28px] pointer-events-none"
                style={{ mixBlendMode: "soft-light" }}
              />

              {/* Foreground glow (NEW) */}
              <div
                className="absolute inset-0 blur-2xl rounded-[28px]"
                style={{
                  background: "var(--gradient-primary)",
                  opacity: 0.08,
                }}
              />

              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="relative w-full rounded-[28px]"
                style={{
                  boxShadow: "var(--shadow-soft-xl)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;