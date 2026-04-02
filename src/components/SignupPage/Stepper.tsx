import { Check } from "lucide-react";

export default function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step > s
                ? "bg-primary text-white"
                : step === s
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-gray-200 text-gray-400"
              }`}
          >
            {step > s ? <Check size={12} /> : s}
          </div>

          {s < 3 && (
            <div
              className={`w-10 h-[2px] ${
                step > s ? "bg-primary" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}