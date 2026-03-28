import React, { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

const CTA: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cursor tracking (for glow)
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      containerRef.current.style.setProperty(
        "--x",
        `${e.clientX - rect.left}px`
      );
      containerRef.current.style.setProperty(
        "--y",
        `${e.clientY - rect.top}px`
      );
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Parallax (section level)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), {
    stiffness: 120,
    damping: 20,
  });

  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), {
    stiffness: 120,
    damping: 20,
  });

  const handleMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative w-full overflow-hidden bg-[#0b0b0c] py-28 px-6 flex items-center justify-center"
    >
      {/* === Cursor Glow (Global) === */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute w-[500px] h-[500px] bg-amber-400/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 left-[var(--x)] top-[var(--y)] transition-opacity duration-300" />
      </div>

      {/* === Background Glow === */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(197,139,69,0.18),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(197,139,69,0.12),transparent_70%)] blur-[120px]" />
      </div>

      {/* === Content (Parallax Layer) === */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1200,
        }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight"
        >
          Take control of your{" "}
          <span className="bg-gradient-to-r from-[#fbba6f] to-[#c58b45] bg-clip-text text-transparent">
            business today
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Stop juggling systems. Start running your business with clarity through
          a unified ERP built for modern pharmaceutical operations.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col items-center gap-8"
        >
          <button className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white rounded-full overflow-hidden active:scale-95 transition-all duration-300">
            
            {/* Animated Gradient Border */}
            <span className="absolute inset-0 rounded-full p-[1px] bg-[linear-gradient(120deg,#fbbf24,#f59e0b,#fcd34d,#f59e0b)] bg-[length:300%_300%] animate-gradient" />

            {/* Inner Button */}
            <span className="relative flex items-center gap-3 px-10 py-5 rounded-full bg-[#0b0b0c] border border-white/10 group-hover:border-white/30 transition">

              {/* Cursor Glow (button-level) */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                <span className="absolute w-[200px] h-[200px] bg-amber-400/20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 left-[var(--x)] top-[var(--y)]" />
              </span>

              <span className="relative flex items-center gap-3">
                Book Your Free Demo Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </button>

          {/* Trust Row */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#c58b45]" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c58b45]" />
              Setup in minutes
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c58b45]" />
              Trusted by growing businesses
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default CTA;