import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const StickyCTA: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [hideNearFooter, setHideNearFooter] = useState(false);
  const [ctaText, setCtaText] = useState("Start running your business with clarity");
  const [hiddenByInteraction, setHiddenByInteraction] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;

      // ✅ Show after hero
      setVisible(window.scrollY > vh * 0.4);

      // ✅ Hide near footer
      const footer = document.querySelector("footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setHideNearFooter(rect.top < vh * 0.9);
      }

      // ✅ Dynamic CTA based on section visibility
      const problem = document.querySelector("#problem");
      const testimonials = document.querySelector("#testimonials");

      if (testimonials) {
        const rect = testimonials.getBoundingClientRect();
        if (rect.top < vh * 0.6 && rect.bottom > vh * 0.4) {
          setCtaText("Join 500+ businesses");
          return;
        }
      }

      if (problem) {
        const rect = problem.getBoundingClientRect();
        if (rect.top < vh * 0.6 && rect.bottom > vh * 0.4) {
          setCtaText("Fix your cash flow chaos");
          return;
        }
      }

      // Default
      setCtaText("Start running your business with clarity");
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Optional: listen for global modal open events
  useEffect(() => {
    const handleModalOpen = () => setHiddenByInteraction(true);

    window.addEventListener("open-modal", handleModalOpen);

    return () => {
      window.removeEventListener("open-modal", handleModalOpen);
    };
  }, []);

  const handleClick = () => {
    setHiddenByInteraction(true);

    // 🔥 If you open modal manually, dispatch event
    window.dispatchEvent(new Event("open-modal"));
  };

  if (!visible || hideNearFooter || hiddenByInteraction) return null;

  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        w-[calc(100%-24px)] max-w-xl
        transition-all duration-500
      "
    >
      <div className="relative group">

        {/* Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-70 group-hover:opacity-100 transition" />

        {/* Card */}
        <div className="relative flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-theme bg-card/90 backdrop-blur-md shadow-lg">

          {/* Text */}
          <div className="flex flex-col leading-tight">
            <p className="text-[13px] text-main font-medium">
              {ctaText}
            </p>
            <span className="text-[11px] text-muted">
              Setup takes 2 minutes
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={handleClick}
            className="flex items-center gap-2 text-[13px] font-semibold text-white bg-primary px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
          >
            Start Free Trial
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTA;