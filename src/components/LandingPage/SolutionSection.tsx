// import React from "react";
// import {
//   ShoppingCart,
//   Wallet,
//   Boxes,
//   Users,
//   type LucideIcon,
// } from "lucide-react";

// type Feature = {
//   label: string;
//   title: string;
//   desc: string;
//   icon: LucideIcon;
// };

// const features: Feature[] = [
//   {
//     label: "Sales",
//     title: "Track every order from start to finish",
//     desc: "Manage quotations, invoices, and the full sales flow in one streamlined workflow — no switching between tools.",
//     icon: ShoppingCart,
//   },
//   {
//     label: "Accounting",
//     title: "Keep your books accurate, automatically",
//     desc: "Every transaction recorded as it happens, so your accounts stay current without manual data entry.",
//     icon: Wallet,
//   },
//   {
//     label: "Inventory",
//     title: "Know exactly what’s in stock",
//     desc: "A single, real-time view of stock across your business, instead of piecing it together from spreadsheets.",
//     icon: Boxes,
//   },
//   {
//     label: "Customer",
//     title: "One place for every customer relationship",
//     desc: "Track customer details, history, and outstanding payments without digging through separate records.",
//     icon: Users,
//   },
// ];

// const SolutionSection: React.FC = () => {
//   return (
//     <section className="section-lg relative overflow-hidden" style={{ background: "#fff" }}>

//       {/* Background */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           background:
//             "radial-gradient(circle at 50% 20%, rgba(37,99,235,0.06), transparent 60%)",
//         }}
//       />

//       <div className="container-wide relative z-10">

//         {/* HEADER */}
//         <div className="text-center max-w-2xl mx-auto stack-md">

//           <h2
//             className="text-[34px] md:text-[40px] font-semibold leading-tight tracking-tight"
//             style={{ color: "#0f1f3d" }}
//           >
//             One system to run your entire business — clearly and efficiently
//           </h2>

//           <p className="text-[15px] leading-relaxed" style={{ color: "#5a7199" }}>
//             No more juggling tools or fixing mismatches. Every module works together, in one place.
//           </p>

//         </div>

//         {/* STORY BLOCKS */}
//         <div className="mt-20 space-y-24">

//           {features.map((feature, index) => {
//             const isReverse = index % 2 !== 0;
//             const Icon = feature.icon;

//             return (
//               <div
//                 key={index}
//                 className="grid lg:grid-cols-2 gap-16 items-center"
//               >

//                 {/* ICON PANEL SIDE */}
//                 <div className={`${isReverse ? "lg:order-2" : ""}`}>

//                   <div className="relative group">

//                     {/* Glow */}
//                     <div
//                       className="absolute inset-0 blur-3xl rounded-[32px] opacity-25"
//                       style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
//                     />

//                     {/* Panel */}
//                     <div
//                       className="relative overflow-hidden rounded-[28px] flex items-center justify-center h-[300px] md:h-[360px]"
//                       style={{
//                         background:
//                           "linear-gradient(160deg, rgba(235,242,255,0.92) 0%, rgba(218,232,252,0.88) 100%)",
//                         border: "1px solid rgba(255,255,255,0.80)",
//                         boxShadow: "0 20px 60px rgba(15,31,61,0.10)",
//                       }}
//                     >
//                       <div
//                         className="w-24 h-24 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
//                         style={{
//                           background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
//                           boxShadow: "0 12px 32px rgba(37,99,235,0.35)",
//                         }}
//                       >
//                         <Icon size={40} className="text-white" />
//                       </div>

//                       {/* decorative grid */}
//                       <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />
//                     </div>

//                   </div>

//                 </div>

//                 {/* TEXT SIDE */}
//                 <div className={`stack-md ${isReverse ? "lg:order-1" : ""}`}>

//                   <p
//                     className="text-[12px] font-semibold tracking-wide uppercase"
//                     style={{ color: "#2563eb" }}
//                   >
//                     {feature.label}
//                   </p>

//                   <h3
//                     className="text-[26px] md:text-[30px] font-semibold leading-snug"
//                     style={{ color: "#0f1f3d" }}
//                   >
//                     {feature.title}
//                   </h3>

//                   <p
//                     className="text-[15px] leading-relaxed max-w-[520px]"
//                     style={{ color: "#5a7199" }}
//                   >
//                     {feature.desc}
//                   </p>

//                 </div>

//               </div>
//             );
//           })}

//         </div>

//         {/* REMAINING MODULES NOTE */}
//         <div className="text-center mt-20">
//           <p className="text-[14px]" style={{ color: "#5a7199" }}>
//             Plus Procurement, Assets, Human Resource, Expense Management, and Settings —
//             <span className="font-medium" style={{ color: "#0f1f3d" }}> all in the same system.</span>
//           </p>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default SolutionSection;