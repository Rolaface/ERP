import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

/* ✅ GROUPED FAQs (progressive disclosure) */
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
        a: "Absolutely. You get full visibility into receivables and payables, with real-time tracking. Many users report 60–70% less time spent on reconciliation.",
      },
      {
        q: "How is this different from traditional accounting tools?",
        a: "Traditional tools focus only on accounting. This system connects payments, inventory, sales, and accounting — so you don’t have to switch tools or fix mismatches manually.",
      },
    ],
  },
  {
    title: "Security & Reliability",
    items: [
      {
        q: "Is my business data safe here?",
        a: "Yes. Your data is encrypted, securely stored, and automatically backed up. The system is designed with enterprise-grade safeguards to ensure reliability and safety.",
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  /* Flatten for search */
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

  /* ✅ Smart open on search */
  useEffect(() => {
    if (query && filtered.length > 0) {
      setActive(filtered[0].key);
    }
  }, [query]);

  /* Scroll auto-open (fallback) */
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.6 && !active) {
        setActive("0-0");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active]);

  return (
    <section className="section section-alt relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 pointer-events-none" />

      <div ref={containerRef} className="container-app max-w-3xl">

        {/* HEADER */}
        <div className="text-center stack-md animate-fade-in">
          <h2 className="text-[32px] md:text-[38px] font-semibold text-main leading-snug tracking-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] bg-clip-text text-transparent">
              know before getting started
            </span>
          </h2>

          <p className="text-body text-muted max-w-lg mx-auto">
            Clear answers so you can make the right decision with confidence.
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

        {/* FAQ GROUPS */}
        <div className="mt-[calc(var(--density-gap)*5)] space-y-[calc(var(--density-gap)*3)]">

          {(query ? [{ title: "Results", items: filtered }] : faqGroups).map(
            (group: any, gi: number) => (
              <div key={gi}>

                {/* Group Title */}
                {!query && (
                  <h3 className="text-[13px] font-semibold text-muted uppercase tracking-wider mb-3">
                    {group.title}
                  </h3>
                )}

                <div className="divide-y divide-[rgba(0,0,0,0.06)]">

                  {group.items.map((item: any, ii: number) => {
                    const key = query ? item.key : `${gi}-${ii}`;
                    const isOpen = active === key;

                    return (
                      <div
                        key={key}
                        className={`
                          py-[calc(var(--density-gap)*2.4)] px-2 rounded-lg transition-all duration-300
                          ${isOpen ? "bg-primary/5 border-l-2 border-primary" : ""}
                        `}
                      >

                        {/* QUESTION */}
                        <button
                          onClick={() => setActive(isOpen ? null : key)}
                          className="w-full flex justify-between text-left"
                        >
                          <h3 className="text-[15px] font-medium text-main">
                            {item.q}
                          </h3>

                          <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-primary"
                          >
                            <Plus size={18} />
                          </motion.div>
                        </button>

                        {/* ANSWER */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, y: -6 }}
                              animate={{ height: "auto", opacity: 1, y: 0 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
                                <p className="text-[14px] text-muted leading-relaxed max-w-[92%]">
                                  {item.a}
                                </p>
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
        </div>

        {/* FINAL OBJECTION KILLER */}
        <div className="text-center mt-[calc(var(--density-gap)*5)] animate-fade-in">
          <p className="text-[14px] text-muted">
            Still unsure?{" "}
            <span className="text-primary font-medium">
              Try it risk-free — setup takes less than 2 minutes.
            </span>
          </p>
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