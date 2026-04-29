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
      const rotateY = (hover ? mouseX * 1.2 : mouseX) + 1.5;
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

  // Magnetic CTA
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

      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      <div className="container-app">
        <div className="hero-layout items-center gap-8 lg:gap-4">

          {/* LEFT */}
          <div className="container-narrow stack-lg">
            <div className="badge glass w-fit motion-fade-up">
              Trusted by 500+ growing businesses
            </div>

            <h1 className="max-w-[640px] text-[38px] md:text-[52px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight text-main motion-fade-up motion-delay-1">
              <div>Run your entire business</div>
              <div className="text-gradient">
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

            {/* CTA */}
            <div className="flex flex-col items-start gap-2 mt-4 motion-fade-up motion-delay-3">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  ref={buttonRef}
                  className="btn btn-primary btn-premium"
                >
                  Start Free Trial →
                </button>

                <button className="btn btn-outline backdrop-blur-md">
                  See Live Demo
                </button>
              </div>

              <span className="text-[13px] text-muted">
                Takes less than 2 minutes to get started
              </span>
            </div>

            <div className="flex items-center gap-5 text-[13px] text-muted mt-2 motion-fade-up motion-delay-4">
              <span>✔ No credit card required</span>
              <span>✔ Setup in minutes</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0 overflow-visible">

            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[520px] h-[520px] rounded-full blur-3xl bg-[var(--gradient-primary)] opacity-10" />
            </div>

            {/* Shadow */}
            <div className="absolute bottom-[-30px] w-[70%] h-[60px] bg-black/10 blur-2xl rounded-full"></div>

            {/* Floating badge */}
            <div className="absolute top-6 left-6 badge glass animate-float-delayed">
              Live cash flow tracking
            </div>

            {/* IMAGE */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[680px] motion-fade-up motion-delay-[120ms]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                ref={lightRef}
                className="absolute inset-0 rounded-[28px] pointer-events-none"
                style={{ mixBlendMode: "soft-light" }}
              />

              <div className="image-interactive card-premium rounded-[28px] overflow-hidden">
                <img
                  src="/dashboard.png"
                  alt="ERP Dashboard"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none bg-gradient-to-b from-transparent to-[var(--bg)]" />
    </section>
  );
};

export default HeroSection;