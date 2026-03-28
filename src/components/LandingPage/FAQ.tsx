import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "How is this different from Tally or traditional software?",
    a: "Unlike Tally, this isn’t just accounting. You get inventory, payments, compliance, and operations—all in one system built specifically for modern pharma businesses.",
  },
  {
    q: "Will my team be able to use it easily?",
    a: "Yes. Designed for non-technical users. Most teams get comfortable within a day without complex training.",
  },
  {
    q: "Can I track both customer and supplier payments?",
    a: "Absolutely. Get full visibility into receivables and payables with automated tracking and reports.",
  },
  {
    q: "Do you provide onboarding and ongoing support?",
    a: "Yes. We help you set up, migrate your data, and continue supporting you as your business grows.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your data is encrypted, securely stored, and automatically backed up so you never have to worry.",
  },
];

const FAQ: React.FC = () => {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section className="relative py-28 px-6 bg-gradient-to-b from-white to-gray-50">
      
      {/* Glow Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(197,139,69,0.15),transparent_70%)] blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-amber-600 font-semibold">
            FAQs
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight">
            Everything you need to know
          </h2>
          <p className="mt-6 text-gray-500 text-lg">
            Quick answers to common questions before you get started
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((item, i) => {
            const isOpen = active === i;

            return (
              <div
                key={i}
                className="group rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all"
              >
                <button
                  onClick={() => setActive(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.q}
                  </h3>

                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-amber-600"
                  >
                    <Plus />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-gray-600 leading-relaxed max-w-[90%]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        

      </div>

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

export default FAQ;