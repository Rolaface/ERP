import { Check } from "lucide-react";

type StepperProps = {
  step: number;
  errorMessages?: Record<number, string>;
};

export default function Stepper({ step, errorMessages = {} }: StepperProps) {
  const steps = ["ACCOUNT", "WORKSPACE", "REVIEW"];

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-10">
      {/* STRIPE STYLE PROGRESS BAR */}
      <div className="w-full h-[3px] bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* STEPPER */}
      <div className="flex items-center justify-between">
        {steps.map((label, i) => {
          const s = i + 1;

          const isActive = step === s;
          const isCompleted = step > s;
          const hasError = Boolean(errorMessages[s]);

          return (
            <div key={s} className="flex items-center flex-1 relative">
              {/* STEP */}
              <div className="flex flex-col items-center flex-shrink-0 z-10 relative group">
                {/* Circle */}
                <div
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-full
                    transition-all duration-300
                    ${
                      hasError
                        ? "bg-red-100 ring-4 ring-red-50"
                        : isCompleted
                        ? "bg-blue-600 text-white"
                        : isActive
                        ? "bg-blue-100 ring-4 ring-blue-50"
                        : "bg-gray-100"
                    }
                  `}
                >
                  {isCompleted && !hasError ? (
                    <Check size={16} />
                  ) : (
                    <div
                      className={`
                        rounded-full
                        ${
                          hasError
                            ? "w-3 h-3 bg-red-600"
                            : isActive
                            ? "w-3 h-3 bg-blue-600"
                            : "w-2 h-2 bg-gray-400"
                        }
                      `}
                    />
                  )}
                </div>

                {/* LABEL */}
                <span
                  className={`
                    mt-2 text-xs font-semibold tracking-wide
                    transition-colors duration-300
                    ${
                      hasError
                        ? "text-red-600"
                        : isActive || isCompleted
                        ? "text-gray-900"
                        : "text-gray-400"
                    }
                  `}
                >
                  {label}
                </span>

                {/* ERROR TOOLTIP */}
                {hasError && (
                  <div className="absolute top-12 scale-0 group-hover:scale-100 transition-transform duration-200 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {errorMessages[s]}
                  </div>
                )}
              </div>

              {/* PROGRESS LINE */}
              {s < steps.length && (
                <div className="flex-1 h-[2px] bg-gray-200 mx-2 relative">
                  <div
                    className={`
                      absolute inset-0 bg-blue-600 transition-all duration-500
                      ${step > s ? "w-full" : "w-0"}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}