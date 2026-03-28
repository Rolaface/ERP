import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Receipt,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    id: "01",
    icon: Building2,
    title: "Setup your business",
    desc: "Add company, users, and accounts to personalize your workspace environment.",
  },
  {
    id: "02",
    icon: Receipt,
    title: "Start recording transactions",
    desc: "Easily log sales, purchases, and payments with our intuitive ledger-style interface.",
  },
  {
    id: "03",
    icon: BarChart3,
    title: "Track everything in real-time",
    desc: "Your dashboard and financial reports update instantly as data flows through the system.",
  },
  {
    id: "04",
    icon: ShieldCheck,
    title: "Stay in control",
    desc: "Know your cash flow, outstanding dues, and net profits at any moment.",
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="relative py-28 bg-[#f9f9f9] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,139,69,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-xs font-bold tracking-[0.2em] text-[#845411] uppercase">
            How It Works
          </span>

          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-[#1a1c1c]">
            Get started in minutes,{" "}
            <span className="text-[#c58b45]">not weeks</span>
          </h2>

          <p className="mt-6 text-lg text-[#514538] opacity-80">
            A simple 4-step process to run your entire business
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d5c3b3] to-transparent opacity-40" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="group flex flex-col items-center md:items-start text-center md:text-left"
              >
                {/* Icon */}
                <div className="mb-6 relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-[0px_20px_40px_rgba(81,69,56,0.08)] group-hover:bg-[#845411] transition-all duration-300"
                  >
                    <Icon
                      size={26}
                      className="text-[#845411] group-hover:text-white transition-colors"
                    />
                  </motion.div>

                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#cfe6f2] text-[#354a53] text-xs font-bold flex items-center justify-center">
                    {step.id}
                  </div>
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ y: -6 }}
                  className="p-6 bg-white rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.04)] border border-[#d5c3b3]/20 w-full transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-[#1a1c1c] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#514538] leading-relaxed opacity-80">
                    {step.desc}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Trust Line */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-[#d5c3b3]/20 shadow-sm">
            <ShieldCheck size={16} className="text-[#845411]" />
            <p className="text-sm text-[#514538] font-medium">
              No technical setup. Your team can start instantly.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;