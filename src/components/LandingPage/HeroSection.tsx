import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {ROUTES} from "../../routes/RoutesPath"


const HeroSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Central motion state (prevents transform conflicts)
  const state = useRef({
    mouseX: 0,
    mouseY: 0,
    scrollY: 0,
    hover: false,
  });

  // ✅ Unified animation loop
  useEffect(() => {
    let raf: number;

    const update = () => {
      const el = imageRef.current;
      if (!el) return;

      const { mouseX, mouseY, scrollY, hover } = state.current;

      const rotateX = hover ? -mouseY * 1.2 : -mouseY;
      const rotateY = hover ? mouseX * 1.2 : mouseX;

      const translateY = scrollY * -20;
      const scale = hover ? 1.06 : 1.04;

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

  // ✅ Mouse movement (tilt + lighting)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      state.current.mouseX = (e.clientX - innerWidth / 2) / 80;
      state.current.mouseY = (e.clientY - innerHeight / 2) / 80;

      // lighting
      if (lightRef.current) {
        lightRef.current.style.background = `
          radial-gradient(
            circle at ${e.clientX}px ${e.clientY}px,
            rgba(255,255,255,0.25),
            transparent 60%
          )
        `;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ✅ Scroll depth
  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const vh = window.innerHeight;

      const progress = (vh - rect.top) / (vh + rect.height);
      state.current.scrollY = (progress - 0.5) * 1.2; // centered motion
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Hover detection (mobile safe)
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

  // ✅ Magnetic CTA
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

        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px) scale(1.04)`;
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
        <div className="hero-layout items-center">

          {/* LEFT */}
          <div className="container-narrow stack-lg">
            <div className="badge glass w-fit motion-fade-up">
              Trusted by 500+ growing businesses
            </div>

            <h1 className="text-[36px] md:text-[48px] lg:text-[60px] font-semibold leading-[1.1] tracking-tight text-main motion-fade-up motion-delay-1">
              <div>Run your entire business</div>
              <div className="text-gradient">
                from one powerful dashboard
              </div>
              <div className="text-muted">without chaos</div>
            </h1>

            <p className="text-muted text-[18px] max-w-[520px] leading-relaxed motion-fade-up motion-delay-2">
              Manage inventory, sales, and operations in one place — built for
              modern distributors and trading businesses.
            </p>

            <div className="flex items-center gap-4 flex-wrap mt-4 motion-fade-up motion-delay-3">
              <Link to={ROUTES.SIGNUP}>
               <button
                 ref={buttonRef}
               className="btn btn-premium relative overflow-hidden"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--glow-primary)",
                   color: "#fff",
                  border: "none",
                }}
              >
                 <span className="relative z-10">Start Free Trial →</span>
               </button>
             </Link>

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
          <div className="relative flex justify-center lg:justify-end mt-14 lg:mt-0 overflow-visible">

            {/* Ambient Glow */}
            <div
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl animate-float-premium"
              style={{ background: "var(--gradient-primary)", opacity: 0.18 }}
            />

            <div
              className="absolute bottom-[-40px] -left-20 w-40 h-40 rounded-full blur-2xl animate-float-delayed"
              style={{ background: "var(--gradient-primary)", opacity: 0.15 }}
            />

            {/* IMAGE */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[700px] animate-float transition-transform duration-300"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Lighting layer */}
              <div
                ref={lightRef}
                className="absolute inset-0 rounded-[28px] pointer-events-none"
                style={{ mixBlendMode: "soft-light" }}
              />

              {/* Soft glow */}
              <div
                className="absolute inset-0 blur-3xl rounded-[28px]"
                style={{
                  background: "var(--gradient-primary)",
                  opacity: 0.10,
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