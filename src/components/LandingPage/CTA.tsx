// import React from "react";
// import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

// const CTA: React.FC = () => {
//   return (
//     <section id="get-started" className="section text-white relative overflow-hidden" style={{ background: "#0f1f3d" }}>


//       <div className="absolute inset-0 pointer-events-none">

//         {/* Primary spotlight */}
//         <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_65%)] blur-[100px]" />

//         {/* Secondary accent */}
//         <div className="absolute bottom-[-30%] right-[15%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(29,78,216,0.18),transparent_70%)] blur-[90px]" />

//         {/* Subtle grid */}
//         <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:42px_42px]" />
//       </div>

//       <div className="container-app text-center relative z-10">

//         {/* HEADER */}
//         <div className="max-w-3xl mx-auto stack-md animate-fade-in">

//           <h2 className="text-[36px] md:text-[52px] font-semibold leading-tight tracking-tight">

//             <span className="text-red-400">
//               Stop running your business in chaos.
//             </span>

//             <br />

//             <span
//               style={{
//                 background: "linear-gradient(90deg, #60a5fa, #3b82f6)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//                 backgroundClip: "text",
//               }}
//             >
//               Start running it with clarity.
//             </span>

//           </h2>

//           <p className="text-[15px] text-gray-300 max-w-xl mx-auto leading-relaxed">
//             Replace spreadsheets, scattered tools, and constant guesswork
//             with one system built to give you complete control.
//           </p>

//         </div>

//         {/* CTA BLOCK */}
//         <div className="mt-12 flex flex-col items-center gap-5 animate-fade-up">

//           {/* PRIMARY CTA */}
//           <div className="relative group">

//             {/* Glow ring */}
//             <div
//               className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
//               style={{ background: "rgba(37,99,235,0.30)" }}
//             />

//             {/* Gradient border */}
//             <div
//               className="p-[1px] rounded-2xl animate-gradient-x"
//               style={{
//                 background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
//               }}
//             >
//               <button
//                 className="relative text-white rounded-2xl px-9 py-4 text-[15px] font-medium flex items-center gap-2 shadow-2xl hover:shadow-[0_20px_60px_rgba(59,130,246,0.4)] transition-all duration-300 group-hover:scale-[1.04] active:scale-[0.97]"
//                 style={{ background: "#1d4ed8" }}
//               >
//                 Start Free Trial
//                 <span className="transition-transform duration-300 group-hover:translate-x-1">
//                   <ArrowRight size={18} />
//                 </span>
//               </button>
//             </div>
//           </div>

//           <p className="text-[13px] text-gray-400">
//             No credit card required • Setup in under 2 minutes
//           </p>

//         </div>

//         {/* TRUST SIGNALS */}
//         <div className="mt-14 flex flex-wrap justify-center gap-5 animate-fade-in">

//           <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 backdrop-blur-md">
//             <ShieldCheck size={14} style={{ color: "#60a5fa" }} />
//             No credit card required
//           </div>

//           <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 backdrop-blur-md">
//             <Zap size={14} style={{ color: "#60a5fa" }} />
//             Setup in minutes
//           </div>

//         </div>

//       </div>

//       {/* ANIMATIONS */}
//       <style>
//         {`
//           .animate-fade-in {
//             opacity: 0;
//             transform: translateY(20px);
//             animation: ctaFadeIn 0.6s ease forwards;
//           }

//           .animate-fade-up {
//             opacity: 0;
//             transform: translateY(30px);
//             animation: ctaFadeUp 0.7s ease forwards;
//           }

//           .animate-gradient-x {
//             background-size: 200% 200%;
//             animation: ctaGradientMove 4s ease infinite;
//           }

//           @keyframes ctaGradientMove {
//             0% { background-position: 0% 50%; }
//             50% { background-position: 100% 50%; }
//             100% { background-position: 0% 50%; }
//           }

//           @keyframes ctaFadeIn {
//             to { opacity: 1; transform: translateY(0); }
//           }

//           @keyframes ctaFadeUp {
//             to { opacity: 1; transform: translateY(0); }
//           }
//         `}
//       </style>
//     </section>
//   );
// };

// export default CTA;