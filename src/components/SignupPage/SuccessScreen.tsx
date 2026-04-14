import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import ButtonPro from "../Form/ButtonPro";

const DISABLE_REDIRECT = true;

export default function SuccessScreen() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = {
          ready: Math.random() > 0.8,
          error: Math.random() < 0.05,
        };

        if (res.error) {
          throw new Error("Something went wrong while setting up workspace.");
        }

        if (!res.ready) {
          setProgress((prev) => Math.min(prev + Math.random() * 15, 90));
        }

        if (res.ready) {
          setReady(true);
          setProgress(100);
          clearInterval(interval);

          if (!DISABLE_REDIRECT) {
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1200);
          }
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
        clearInterval(interval);
      }
    };

    interval = setInterval(poll, 2000);
    poll();

    return () => clearInterval(interval);
  }, []);

  const retry = () => {
    setError(null);
    setProgress(10);
    setReady(false);
  };

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
    <div className="success-page min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-app">
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
        <motion.div variants={item} className="mb-6 relative flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-row-hover">
            {error ? (
              <AlertCircle className="text-red-500" size={36} />
            ) : (
              <Check className="text-primary" size={36} strokeWidth={2.5} />
            )}
          </div>

          {!error && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute w-24 h-24 border border-theme rounded-full"
            />
          )}
        </motion.div>

        {/* TITLE */}
        <motion.h1 variants={item} className="form-title">
          {error ? "Setup Failed" : "You’re all set!"}
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p variants={item} className="form-subtitle max-w-[320px] mx-auto">
          {error
            ? "We couldn’t complete your workspace setup. Please try again."
            : "We’re setting up your workspace. This will take a moment."}
        </motion.p>

        {/* PROGRESS BAR */}
        {!error && (
          <motion.div variants={item} className="mt-6 w-full">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.6 }}
              />
            </div>
            <div className="text-xs text-muted mt-2">
              {ready ? "Completed" : `${Math.floor(progress)}%`}
            </div>
          </motion.div>
        )}

        {/* STATE */}
        <motion.div
          variants={item}
          className="card mt-6 flex items-center gap-3 justify-center"
        >
          {error ? (
            <>
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-body text-red-500 font-medium">
                {error}
              </span>
            </>
          ) : !ready ? (
            <>
              <div className="w-6 h-2 bg-primary/20 rounded overflow-hidden relative">
                <div className="absolute inset-0 animate-pulse bg-primary/40" />
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
        {!error && (
          <motion.div
            variants={item}
            className="flex items-center justify-center gap-2 text-xs text-muted uppercase tracking-wide mt-6"
          >
            <Mail size={14} />
            <span>We’ll notify you via email once ready</span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div variants={item} className="form-footer">
          {error ? (
            <ButtonPro onClick={retry} leftIcon={<RefreshCw size={16} />}>
              Retry Setup
            </ButtonPro>
          ) : (
            <ButtonPro
              disabled={!ready}
              onClick={() => {
                if (!DISABLE_REDIRECT) {
                  window.location.href = "/dashboard";
                }
              }}
              rightIcon={<ArrowRight size={16} />}
            >
              Go to Dashboard
            </ButtonPro>
          )}
        </motion.div>

        {/* FOOTER */}
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