import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail, ArrowRight } from "lucide-react";

export default function SuccessScreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = { ready: Math.random() > 0.7 };

        if (res.ready) {
          setReady(true);
          clearInterval(interval);

          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1200);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    interval = setInterval(poll, 3000);
    poll();

    return () => clearInterval(interval);
  }, []);

  const container = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-app">

      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="form-card text-center motion-scale-in max-w-[460px] w-full"
      >
        {/* ICON */}
        <motion.div
          variants={item}
          className="mb-6 relative flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-row-hover">
            <Check className="text-primary" size={36} strokeWidth={2.5} />
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-24 h-24 border border-theme rounded-full"
          />
        </motion.div>

        {/* TITLE */}
        <motion.h1 variants={item} className="form-title">
          You’re all set!
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p variants={item} className="form-subtitle max-w-[320px] mx-auto">
          We’re setting up your workspace. This will take a moment.
        </motion.p>

        {/* PROGRESS */}
        <motion.div
          variants={item}
          className="card mt-6 flex items-center gap-3 justify-center"
        >
          {!ready ? (
            <>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-pulse delay-75" />
                <span className="w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-150" />
              </div>
              <span className="text-body text-primary font-medium">
                Setting up your workspace...
              </span>
            </>
          ) : (
            <>
              <Check size={16} className="text-primary" />
              <span className="text-body text-primary font-medium">
                Workspace ready! Redirecting...
              </span>
            </>
          )}
        </motion.div>

        {/* EMAIL */}
        <motion.div
          variants={item}
          className="flex items-center justify-center gap-2 text-xs text-muted uppercase tracking-wide mt-6"
        >
          <Mail size={14} />
          <span>We’ll notify you via email once ready</span>
        </motion.div>

        {/* CTA */}
        <motion.div variants={item} className="form-footer">
          <button
            disabled={!ready}
            onClick={() => (window.location.href = "/dashboard")}
            className={`btn w-full flex items-center justify-center gap-2 ${
              ready ? "btn-primary" : "btn-outline opacity-60 cursor-not-allowed"
            }`}
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* FOOTER ID */}
        <motion.div
          variants={item}
          className="mt-6 text-[10px] font-mono text-muted uppercase tracking-widest opacity-40"
        >
          ID-882-SYS-ARCHIVIST
        </motion.div>
      </motion.div>
    </div>
  );
}