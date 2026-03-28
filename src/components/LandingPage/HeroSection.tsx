import React, { useEffect, useRef } from "react";

const HeroSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ✅ Parallax Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 25;
      const y = (e.clientY - innerHeight / 2) / 25;

      imageRef.current.style.transform = `
        perspective(1200px)
        rotateY(${x * 0.5}deg)
        rotateX(${-y * 0.5}deg)
        scale(1.05)
      `;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ✅ Magnetic Button
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
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
    <section className="relative w-full bg-[#f8f6f3] pt-28 pb-20 overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-[1fr_1.25fr] items-center gap-10 lg:gap-14">

          {/* LEFT */}
          <div className="max-w-[600px]">

            <h1 className="text-[36px] md:text-[48px] font-medium leading-[1.0] tracking-[-0.02em] text-gray-900">
              Run Your Entire Business
              <br />
              in One Place
              <br />
              <span className="bg-gradient-to-r from-[#c58b45] to-[#e0b97a] bg-clip-text text-transparent">
                Without the Chaos
              </span>
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              Manage sales, inventory, purchases, and payments seamlessly.
            </p>

            <div className="mt-5 flex items-center gap-4">

              {/* Magnetic CTA */}
              <button
                ref={buttonRef}
                className="relative bg-[#c58b45] text-white px-7 py-3.5 rounded-xl shadow-lg transition-all duration-300"
              >
                Get Your Free Demo
              </button>

            </div>

          </div>

          {/* RIGHT */}
          <div className="relative">



            {/* Parallax Image */}
            <div
              ref={imageRef}
              className="transition-transform duration-200"
            >
              <img
                src="/dashboard.png"
                alt="ERP Dashboard"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>

          </div>

        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </section>
  );
};

export default HeroSection;