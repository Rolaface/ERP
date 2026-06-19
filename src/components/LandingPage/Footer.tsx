import React from "react";
import { motion } from "framer-motion";

const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden" style={{ background: "#f8fafd", color: "#5a7199" }}>

      {/* === BACKGROUND SYSTEM === */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(37,99,235,0.08), transparent 60%)" }}
        />
        <div className="absolute inset-0 opacity-[0.04] bg-grid-subtle" />
      </div>

      <div className="relative z-10 container-app px-6">

        {/* ================= MAIN GRID ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-14 pt-20 pb-16"
        >

          {/* BRAND */}
          <div className="col-span-2 md:col-span-1">

            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ERP
            </h2>

            <p className="mt-4 text-sm leading-relaxed max-w-[240px]" style={{ color: "#5a7199" }}>
              Built for businesses that are tired of chaos and want real control over their operations, finances, and growth.
            </p>

            <div className="mt-6 flex items-center gap-2 text-[11px]" style={{ color: "#5a7199" }}>
              <span
                className="px-2 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(200,218,240,0.60)" }}
              >
                Secure
              </span>
              <span
                className="px-2 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(200,218,240,0.60)" }}
              >
                Reliable
              </span>
            </div>

          </div>

          {/* LINK GROUPS */}
          {[
            { title: "Product", items: ["Modules", "How It Works"] },
            { title: "Company", items: ["About", "Contact"] },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold mb-5 text-[14px] tracking-wide" style={{ color: "#0f1f3d" }}>
                {group.title}
              </h4>

              <ul className="space-y-3 text-sm">
                {group.items.map((item) => (
                  <li key={item}>
                    <a className="group inline-block relative transition" style={{ color: "#5a7199" }}>
                      {item}
                      <span
                        className="absolute left-0 -bottom-1 h-[1px] w-0 transition-all duration-300 group-hover:w-full"
                        style={{ background: "#2563eb" }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT — add your real details here */}
          <div>
            <h4 className="font-semibold mb-5 text-[14px] tracking-wide" style={{ color: "#0f1f3d" }}>
              Contact
            </h4>
            
          </div>

        </motion.div>

        {/* ================= BOTTOM BAR ================= */}
        <div
          className="border-t pt-8 pb-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderColor: "rgba(200,218,240,0.50)", color: "#5a7199" }}
        >

          <p>© 2026 ERP. All rights reserved.</p>

          <span className="hidden md:block">
            Built for clarity. Designed for growth.
          </span>

        </div>

      </div>
    </footer>
  );
};

export default Footer;