import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const StickyCTA: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [hideNearFooter, setHideNearFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // ✅ Show after scrolling past hero
      setVisible(scrollY > vh * 0.4);

      // ✅ Hide near footer (avoid stacking CTAs)
      const footer = document.querySelector("footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setHideNearFooter(rect.top < vh * 0.9);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible || hideNearFooter) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        w-[calc(100%-24px)] max-w-xl
        transition-all duration-500
      `}
    >
      <div className="relative group">

        {/* Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-70 group-hover:opacity-100 transition" />

        {/* Card */}
        <div className="relative flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-theme bg-card/90 backdrop-blur-md shadow-lg">

          {/* Text */}
          <p className="text-[13px] text-main font-medium">
            Start running your business with clarity
          </p>

          {/* CTA */}
          <button className="flex items-center gap-2 text-[13px] font-semibold text-white bg-primary px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-md">
            Start Free Trial
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTA;