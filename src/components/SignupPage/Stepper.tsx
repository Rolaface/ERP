import { Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type StepperProps = {
  step: number;
  errorMessages?: Record<number, string>;
  onStepChange?: (step: number) => void; // 👈 navigation
};

export default function Stepper({
  step,
  errorMessages = {},
  onStepChange,
}: StepperProps) {
  const steps = ["ACCOUNT", "WORKSPACE", "REVIEW"];

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full flex justify-center mb-12">
      <div className="w-full max-w-xl">
        <div className="relative w-full flex items-center justify-between px-8">
          
          {/* ===== BASE LINE ===== */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -translate-y-1/2 z-0" />

          {/* ===== GRADIENT PROGRESS LINE (ANIMATED) ===== */}
          <motion.div
            className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-blue-600 -translate-y-1/2 z-10"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />

          {/* ===== STEPS ===== */}
          {steps.map((label, i) => {
            const s = i + 1;

            const isActive = step === s;
            const isCompleted = step > s;
            const hasError = Boolean(errorMessages[s]);

            return (
              <div
                key={s}
                onClick={() => onStepChange?.(s)} // 👈 click navigation
                className="relative z-20 flex flex-col items-center group cursor-pointer"
              >
                {/* ===== CIRCLE (WITH SPRING SCALE) ===== */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`
                    relative flex items-center justify-center
                    rounded-full
                    transition-colors duration-300
                    
                    ${
                      hasError
                        ? "w-3 h-3 bg-red-100 ring-4 ring-red-50"
                        : isCompleted
                        ? "w-3 h-3 bg-blue-600 shadow-sm"
                        : isActive
                        ? "w-3 h-3 bg-white ring-4 ring-blue-100 shadow-sm"
                        : "w-3 h-3 bg-gray-200"
                    }
                  `}
                >
                  {/* CONTENT */}
                  {hasError ? (
                    <AlertCircle size={10} className="text-red-600" />
                  ) : isCompleted ? (
                    <Check size={10} className="text-white" />
                  ) : isActive ? (
                    <motion.div
                      layoutId="active-dot"
                      className="w-1.5 h-1.5 rounded-full bg-blue-600"
                    />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  )}
                </motion.div>

                {/* ===== LABEL ===== */}
                <span
                  className={`
                    absolute -bottom-7 whitespace-nowrap
                    text-[10px] font-semibold tracking-[0.15em] uppercase
                    transition-colors duration-300

                    ${
                      hasError
                        ? "text-red-600"
                        : isActive
                        ? "text-gray-900 font-bold"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400"
                    }
                  `}
                >
                  {label}
                </span>

                {/* ===== TOOLTIP ===== */}
                {hasError && (
                  <div className="absolute top-6 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                    {errorMessages[s]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}