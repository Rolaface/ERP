import React from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Clock,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const benefits = [
  {
    title: "Complete financial clarity",
    desc: "Know exactly where your money is going — no blind spots. Every transaction is tracked with precision.",
    icon: Wallet,
    span: "md:col-span-7",
    highlight: "Real-time audit trails",
  },
  {
    title: "Save hours every week",
    desc: "Eliminate manual work and reconciliation headaches with automated workflows.",
    icon: Clock,
    span: "md:col-span-5",
  },
  {
    title: "Reduce costly mistakes",
    desc: "Automation ensures accuracy across every transaction and eliminates human error.",
    icon: ShieldCheck,
    span: "md:col-span-4",
  },
  {
    title: "Faster decision making",
    desc: "Make confident decisions using real-time insights instead of outdated reports.",
    icon: BarChart3,
    span: "md:col-span-4",
  },
  {
    title: "Scale without chaos",
    desc: "Your system grows with your business without breaking processes or visibility.",
    icon: TrendingUp,
    span: "md:col-span-4",
  },
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="relative py-28 bg-[#f0f0f0] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,139,69,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          

          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-[#1a1c1c] tracking-tight">
            What you actually gain
          </h2>

          <p className="mt-6 text-lg text-[#514538] opacity-80">
            Real improvements you’ll feel in your business every single day
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`${item.span} group bg-white p-8 md:p-10 rounded-xl border border-[#d5c3b3]/20 shadow-[0px_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0px_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300`}
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 rounded-full bg-[#cfe6f2]/40 flex items-center justify-center mb-6 group-hover:bg-[#845411] transition-colors duration-300"
                >
                  <Icon
                    size={22}
                    className="text-[#845411] group-hover:text-white transition-colors"
                  />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl md:text-2xl font-bold text-[#1a1c1c] mb-3">
                  {item.title}
                </h3>

                <p className="text-[#514538] leading-relaxed opacity-80">
                  {item.desc}
                </p>

                {/* Highlight (only for first card) */}
                {item.highlight && (
                  <div className="mt-8 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-semibold text-[#1a1c1c]">
                      {item.highlight}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Reinforcement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-full border border-[#d5c3b3]/20 shadow-sm">
            <Sparkles size={18} className="text-[#845411]" />
            <p className="text-sm text-[#514538] font-medium">
              This isn’t just software — it’s operational clarity.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;