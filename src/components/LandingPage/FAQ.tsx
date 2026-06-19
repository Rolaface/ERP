// import React, { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Plus } from "lucide-react";

// const faqs = [
//   {
//     q: "How is this different from Tally or traditional software?",
//     a: "Tally focuses only on accounting. This system connects your payments, inventory, sales, and accounting in one place — so you don’t have to switch tools or reconcile manually.",
//   },
//   {
//     q: "Will my team be able to use it without training?",
//     a: "Yes. It’s built for non-technical teams. Most businesses get comfortable within a day because the interface is simple and intuitive.",
//   },
//   {
//     q: "Can I track both customer and supplier payments?",
//     a: "Absolutely. You get full visibility into receivables and payables, with real-time tracking and zero confusion about who paid and who hasn’t.",
//   },
//   {
//     q: "Do you help with setup and data migration?",
//     a: "Yes. We assist you with onboarding, data setup, and migration so you can start smoothly without disruption.",
//   },
//   {
//     q: "Is my business data secure?",
//     a: "Yes. Your data is encrypted, securely stored, and automatically backed up — ensuring complete safety and reliability.",
//   },
// ];

// const FAQ: React.FC = () => {
//   const [active, setActive] = useState<number | null>(0);
//   const [query, setQuery] = useState("");
//   const containerRef = useRef<HTMLDivElement>(null);

//   const filteredFaqs = faqs.filter(
//     (item) =>
//       item.q.toLowerCase().includes(query.toLowerCase()) ||
//       item.a.toLowerCase().includes(query.toLowerCase())
//   );

//   useEffect(() => {
//     const handleScroll = () => {
//       if (!containerRef.current) return;

//       const rect = containerRef.current.getBoundingClientRect();
//       const isVisible = rect.top < window.innerHeight * 0.6;

//       if (isVisible && active === null && filteredFaqs.length > 0) {
//         setActive(0);
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [active, filteredFaqs.length]);

//   return (
//     <section id="faq" className="section relative overflow-hidden" style={{ background: "#f8fafd" }}>

//       {/* Background depth */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{ background: "linear-gradient(to bottom, transparent, transparent, rgba(37,99,235,0.04))" }}
//       />

//       <div ref={containerRef} className="container-app max-w-3xl">

//         {/* HEADER */}
//         <div className="text-center stack-md animate-fade-in">

//           <h2 className="text-[32px] md:text-[38px] font-semibold leading-snug tracking-tight" style={{ color: "#0f1f3d" }}>
//             Everything you need to{" "}
//             <span
//               style={{
//                 background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//                 backgroundClip: "text",
//               }}
//             >
//               know before getting started
//             </span>
//           </h2>

//           <p className="max-w-lg mx-auto text-[15px] leading-relaxed" style={{ color: "#5a7199" }}>
//             Clear answers so you can make the right decision with confidence.
//           </p>

//         </div>

//         {/* SEARCH */}
//         <div className="mt-10 animate-fade-in">
//           <div className="relative group">
//             <div
//               className="absolute inset-0 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-2xl"
//               style={{ background: "rgba(37,99,235,0.06)" }}
//             />

//             <input
//               type="text"
//               placeholder="Search your question..."
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               className="relative w-full px-5 py-4 rounded-2xl text-[14px] outline-none transition-all duration-300"
//               style={{
//                 background: "#fff",
//                 border: "1.5px solid rgba(200,218,240,0.60)",
//                 color: "#0f1f3d",
//               }}
//               onFocus={(e) => {
//                 e.currentTarget.style.border = "1.5px solid rgba(37,99,235,0.50)";
//                 e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.border = "1.5px solid rgba(200,218,240,0.60)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}
//             />
//           </div>
//         </div>

//         {/* FAQ LIST */}
//         <div className="mt-12 divide-y" style={{ borderColor: "rgba(200,218,240,0.50)" }}>

//           {filteredFaqs.map((item, i) => {
//             const isOpen = active === i;

//             return (
//               <div key={i} className="py-6">

//                 {/* QUESTION */}
//                 <button
//                   onClick={() => setActive(isOpen ? null : i)}
//                   className="w-full flex items-center justify-between text-left"
//                 >
//                   <div className="flex items-center gap-2 pr-4 flex-wrap">

//                     <h3 className="text-[15px] font-medium" style={{ color: "#0f1f3d" }}>
//                       {item.q}
//                     </h3>

//                     {i < 2 && (
//                       <span
//                         className="text-[10px] px-2 py-[2px] rounded-full font-medium"
//                         style={{ background: "rgba(37,99,235,0.10)", color: "#2563eb" }}
//                       >
//                         Popular
//                       </span>
//                     )}

//                   </div>

//                   <motion.div
//                     animate={{ rotate: isOpen ? 45 : 0 }}
//                     transition={{ duration: 0.3 }}
//                     className="flex-shrink-0"
//                     style={{ color: "#2563eb" }}
//                   >
//                     <Plus size={18} />
//                   </motion.div>
//                 </button>

//                 {/* ANSWER */}
//                 <AnimatePresence initial={false}>
//                   {isOpen && (
//                     <motion.div
//                       initial={{ height: 0, opacity: 0 }}
//                       animate={{ height: "auto", opacity: 1 }}
//                       exit={{ height: 0, opacity: 0 }}
//                       transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
//                       className="overflow-hidden"
//                     >
//                       <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(200,218,240,0.50)" }}>
//                         <p className="text-[14px] leading-relaxed max-w-[92%]" style={{ color: "#5a7199" }}>
//                           {item.a}
//                         </p>
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//               </div>
//             );
//           })}

//           {filteredFaqs.length === 0 && (
//             <p className="text-center text-[13px] py-6" style={{ color: "#5a7199" }}>
//               No results found. Try a different keyword.
//             </p>
//           )}

//         </div>

//         {/* BOTTOM */}
//         <div className="text-center mt-16 animate-fade-in">
//           <p className="text-[14px]" style={{ color: "#5a7199" }}>
//             Still have questions?{" "}
//             <a
//               href="#get-started"
//               className="font-medium hover:underline"
//               style={{ color: "#2563eb" }}
//             >
//               Get in touch
//             </a>{" "}
//             and we’ll guide you step-by-step.
//           </p>
//         </div>

//       </div>

//       {/* ANIMATIONS */}
//       <style>
//         {`
//           .animate-fade-in {
//             opacity: 0;
//             transform: translateY(20px);
//             animation: faqFadeIn 0.6s ease forwards;
//           }

//           @keyframes faqFadeIn {
//             to { opacity: 1; transform: translateY(0); }
//           }
//         `}
//       </style>

//     </section>
//   );
// };

// export default FAQ;