import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqGroups = [
  {
    title: "Getting Started",
    items: [
      {
        q: "Is this right for my business size?",
        a: "Yes. Whether you're a small distributor or a growing team, the system adapts to your scale. Used by 500+ businesses across India, it’s designed to grow with you.",
      },
      {
        q: "Will my team be able to use it without training?",
        a: "Yes. It’s built for non-technical teams. Most businesses get comfortable within a day because the interface is simple and intuitive.",
      },
      {
        q: "Do you help with setup and data migration?",
        a: "Yes. We assist with onboarding and migration so you can switch without disruption. Most businesses are fully set up within 1–2 days.",
      },
    ],
  },
  {
    title: "Payments & Operations",
    items: [
      {
        q: "Can I track both customer and supplier payments?",
        a: "Absolutely. You get full visibility into receivables and payables, with real-time tracking.",
      },
      {
        q: "How is this different from traditional accounting tools?",
        a: "Traditional tools focus only on accounting. This system connects payments, inventory, sales, and accounting — eliminating mismatches.",
      },
    ],
  },
  {
    title: "Security & Reliability",
    items: [
      {
        q: "Is my business data safe here?",
        a: "Yes. Your data is encrypted, securely stored, and automatically backed up with enterprise-grade safeguards.",
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const allFaqs = faqGroups.flatMap((group, gi) =>
    group.items.map((item, ii) => ({
      ...item,
      key: `${gi}-${ii}`,
      group: group.title,
    }))
  );

  const filtered = allFaqs.filter(
    (item) =>
      item.q.toLowerCase().includes(query.toLowerCase()) ||
      item.a.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (query && filtered.length > 0) {
      setActive(filtered[0].key);
    }
  }, [query]);

  return (
    <section className="section section-alt relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />

      <div ref={containerRef} className="container-app max-w-3xl">

        {/* HEADER */}
        <div className="text-center stack-md animate-fade-in">
          <h2 className="text-[32px] md:text-[38px] font-semibold text-main tracking-tight">
            Questions before you start?
          </h2>

          <p className="text-body text-muted max-w-lg mx-auto">
            Everything you need to make a confident decision.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mt-[calc(var(--density-gap)*3)] animate-fade-in">
          <input
            type="text"
            placeholder="Search your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-[calc(var(--density-gap)*1.8)] py-[calc(var(--density-gap)*1.5)] rounded-[calc(var(--density-radius)*1.2)] border border-theme bg-card text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>

        {/* FAQ */}
        <div className="mt-[calc(var(--density-gap)*5)] space-y-[calc(var(--density-gap)*3)]">

          {(query ? [{ title: "Results", items: filtered }] : faqGroups).map(
            (group: any, gi: number) => (
              <div key={gi}>

                {!query && (
                  <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-4">
                    {group.title}
                  </h3>
                )}

                <div className="space-y-3">

                  {group.items.map((item: any, ii: number) => {
                    const key = query ? item.key : `${gi}-${ii}`;
                    const isOpen = active === key;

                    return (
                      <div
                        key={key}
                        className={`
                          group rounded-xl border border-theme bg-card transition-all duration-300
                          ${isOpen ? "shadow-soft-xl" : "hover:shadow-md"}
                        `}
                      >
                        {/* QUESTION */}
                        <button
                          onClick={() => setActive(isOpen ? null : key)}
                          className="w-full flex justify-between items-center px-5 py-4 text-left"
                        >
                          <h3 className="text-[15px] font-medium text-main">
                            {item.q}
                          </h3>

                          <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            className="text-primary"
                          >
                            <Plus size={18} />
                          </motion.div>
                        </button>

                        {/* ANSWER */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 text-[14px] text-muted leading-relaxed border-t border-theme/60 pt-4">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Empty state */}
          {query && filtered.length === 0 && (
            <p className="text-center text-muted text-[14px]">
              No results found. Try a different keyword.
            </p>
          )}
        </div>

        {/* 🔥 CONVERSION BRIDGE */}
        <div className="text-center mt-[calc(var(--density-gap)*5)] animate-fade-in">

          <p className="text-[14px] text-muted">
            Still unsure?
          </p>

          <p className="text-[16px] text-main font-medium mt-1">
            Try it yourself — takes less than 2 minutes to set up.
          </p>

          <button className="mt-4 btn btn-premium px-6 py-3">
            Start Free Trial →
          </button>

        </div>

      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          .animate-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeIn 0.6s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
};

export default FAQ;