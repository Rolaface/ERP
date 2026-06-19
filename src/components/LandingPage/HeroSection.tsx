import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../routes/RoutesPath";

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


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      state.current.mouseX = (e.clientX - innerWidth / 2) / 80;
      state.current.mouseY = (e.clientY - innerHeight / 2) / 80;

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

  const handleDemoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const target = document.querySelector("#how-it-works");
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section className="section-lg relative overflow-hidden" style={{ background: "#fff" }}>

      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(29,78,216,0.10), rgba(59,130,246,0.06))",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 30%, rgba(37,99,235,0.10), transparent 60%)" }}
      />
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none"></div>

      <div className="container-app">
        <div className="hero-layout items-center">

          {/* LEFT */}
          <div className="container-narrow stack-lg">

            <h1
              className="text-[36px] md:text-[48px] lg:text-[60px] font-semibold leading-[1.1] tracking-tight motion-fade-up motion-delay-1"
              style={{ color: "#0f1f3d" }}
            >
              <div>Run your entire business</div>
              <div
                style={{
                  background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                from one powerful dashboard
              </div>
              <div style={{ color: "#5a7199" }}>without chaos</div>
            </h1>

            <p
              className="text-[18px] max-w-[520px] leading-relaxed motion-fade-up motion-delay-2"
              style={{ color: "#5a7199" }}
            >
              Manage sales, inventory, accounting, HR, and every other part of
              your operations from one connected system.
            </p>

            <div className="flex items-center gap-4 flex-wrap mt-4 motion-fade-up motion-delay-3">
              <Link to={ROUTES.SIGNUP}>
                <button
                  ref={buttonRef}
                  className="relative overflow-hidden rounded-2xl px-7 py-3.5 text-[15px] font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                    boxShadow: "0 8px 28px rgba(37,99,235,0.35)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  <span className="relative z-10">Start Free Trial →</span>
                </button>
              </Link>

              <button
                onClick={handleDemoClick}
                className="rounded-2xl px-7 py-3.5 text-[15px] font-semibold backdrop-blur-md transition-colors"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(200,218,240,0.60)",
                  color: "#0f1f3d",
                }}
              >
                See How It Works
              </button>
            </div>

            <div
              className="flex items-center gap-5 text-[13px] mt-2 motion-fade-up motion-delay-4"
              style={{ color: "#5a7199" }}
            >
              <span>✔ No credit card required</span>
              <span>✔ Setup in minutes</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center lg:justify-end mt-14 lg:mt-0 overflow-visible">

            {/* Ambient Glow */}
            <div
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl animate-float-premium"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", opacity: 0.18 }}
            />

            <div
              className="absolute bottom-[-40px] -left-20 w-40 h-40 rounded-full blur-2xl animate-float-delayed"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", opacity: 0.15 }}
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
                  background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                  opacity: 0.10,
                }}
              />

              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="relative w-full rounded-[28px]"
                style={{ boxShadow: "0 20px 60px rgba(15,31,61,0.15)" }}
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;