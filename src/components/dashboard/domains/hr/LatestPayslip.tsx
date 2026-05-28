import React, { useState } from "react";
import {
  BadgeCheck,
  Download,
  Eye,
  EyeOff,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";

const LatestPayslip: React.FC = () => {
  const [isAmountVisible, setIsAmountVisible] = useState(false);

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm
      "
    >
      {/* Background Accent */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.04]
        "
        style={{
          background:
            "radial-gradient(circle at top right, #64748b 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[var(--muted-foreground)]
              "
            >
              Financial Documents
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              Latest Payslip
            </h2>
          </div>

          {/* Security Badge */}
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-slate-500/20
              bg-slate-500/10
              px-3
              py-1.5
              text-sm
              font-medium
              text-slate-600
            "
          >
            <ShieldCheck className="h-4 w-4" />

            <span>Secure Document</span>
          </div>
        </div>

        {/* Payslip Preview */}
        <div
          className="
            relative
            mt-6
            overflow-hidden
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--background)]
          "
        >
          {/* Blur Overlay */}
          <div
            className={`
              absolute
              inset-0
              z-20
              transition-all
              duration-300
              ${
                isAmountVisible
                  ? "backdrop-blur-none bg-transparent"
                  : "backdrop-blur-md bg-black/10"
              }
            `}
          />

          {/* Privacy Indicator */}
          {!isAmountVisible && (
            <div
              className="
                absolute
                inset-0
                z-30
                flex
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/20
                  bg-white/10
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-[var(--foreground)]
                  backdrop-blur-xl
                "
              >
                <Lock className="h-4 w-4" />

                <span>Sensitive Salary Information Hidden</span>
              </div>
            </div>
          )}

          {/* Mock Payslip */}
          <div className="p-6">
            {/* Top */}
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-[var(--border)]
                pb-5
              "
            >
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--primary)]" />

                  <h3
                    className="
                      text-lg
                      font-semibold
                      text-[var(--foreground)]
                    "
                  >
                    Payslip
                  </h3>
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    text-[var(--muted-foreground)]
                  "
                >
                  May 2026 Payroll Summary
                </p>
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  px-3
                  py-1
                  text-xs
                  font-medium
                  text-emerald-600
                "
              >
                <BadgeCheck className="h-3.5 w-3.5" />

                <span>Credited</span>
              </div>
            </div>

            {/* Salary Blocks */}
            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-4
                md:grid-cols-3
              "
            >
              {/* Gross Pay */}
              <div
                className="
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--card)]
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-[var(--muted-foreground)]
                  "
                >
                  Gross Pay
                </p>

                <p
                  className="
                    mt-3
                    text-2xl
                    font-bold
                    tracking-tight
                    text-[var(--foreground)]
                  "
                >
                  ₹85,000
                </p>
              </div>

              {/* Deductions */}
              <div
                className="
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--card)]
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-[var(--muted-foreground)]
                  "
                >
                  Deductions
                </p>

                <p
                  className="
                    mt-3
                    text-2xl
                    font-bold
                    tracking-tight
                    text-[var(--foreground)]
                  "
                >
                  ₹8,500
                </p>
              </div>

              {/* Net Salary */}
              <div
                className="
                  rounded-2xl
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-emerald-700
                  "
                >
                  Net Salary
                </p>

                <p
                  className="
                    mt-3
                    text-2xl
                    font-bold
                    tracking-tight
                    text-emerald-700
                  "
                >
                  ₹76,500
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
                border-t
                border-[var(--border)]
                pt-5
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                  "
                >
                  Processed on May 25, 2026
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--muted-foreground)]
                  "
                >
                  Official payroll document generated securely.
                </p>
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--card)]
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                <ShieldCheck className="h-3.5 w-3.5" />

                <span>Encrypted Payroll Record</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="
            mt-6
            flex
            flex-wrap
            items-center
            gap-3
          "
        >
          {/* Reveal Amount */}
          <button
            onClick={() =>
              setIsAmountVisible(!isAmountVisible)
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-[var(--primary)]
              px-5
              py-3
              text-sm
              font-medium
              text-white
              shadow-sm
              transition-all
              hover:opacity-90
            "
          >
            {isAmountVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}

            <span>
              {isAmountVisible
                ? "Hide Amount"
                : "Reveal Amount"}
            </span>
          </button>

          {/* Download */}
          <button
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              px-5
              py-3
              text-sm
              font-medium
              text-[var(--foreground)]
              transition-all
              hover:border-[var(--primary)]
              hover:bg-[var(--accent)]
            "
          >
            <Download className="h-4 w-4" />

            <span>Download Payslip</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default LatestPayslip;