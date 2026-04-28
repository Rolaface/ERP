import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? `
            bg-card/70 backdrop-blur-2xl 
            border-b border-theme/60 
            shadow-[0_4px_20px_rgba(0,0,0,0.04)]
          `
          : `
            bg-card/50 backdrop-blur-xl 
            border-b border-transparent
          `
      }`}
    >
      <div className="container-app flex items-center justify-between h-16">
        
        {/* LEFT: LOGO */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-[var(--density-radius)] bg-primary flex items-center justify-center text-white font-bold shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
            ERP
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-main tracking-tight transition-colors group-hover:text-primary">
              YourERP
            </span>

            <span className="text-[10px] text-muted hidden md:block">
              Trusted by 500+ businesses
            </span>
          </div>
        </div>

        {/* CENTER: NAV LINKS */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted">
          {[
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Customers", href: "#customers" },
            { name: "Demo", href: "#demo" },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="relative group px-1 py-1"
            >
              <span className="transition-colors duration-150 group-hover:text-main">
                {item.name}
              </span>

              {/* Premium underline (left → right) */}
              <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary scale-x-0 origin-left transition-transform duration-150 ease-out group-hover:scale-x-100"></span>
            </a>
          ))}
        </div>

        {/* RIGHT: LOGIN + CTA */}
        <div className="flex items-center gap-3">
          
          {/* Login */}
          <Link
            to="/login"
            className="hidden md:block text-sm font-medium text-muted hover:text-main transition-colors duration-150"
          >
            Login
          </Link>

          {/* CTA */}
          <Link to="/signup">
            <button
              className={`
                relative inline-flex items-center justify-center
                px-[var(--density-padding-lg)] py-[var(--density-padding-sm)]
                text-sm font-semibold text-white
                rounded-[var(--density-radius)]
                bg-primary

                shadow-[0_2px_6px_rgba(0,0,0,0.08)]
                transition-all duration-200

                hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                hover:scale-[1.02]

                active:scale-[0.98]
              `}
            >
              {/* Soft glow */}
              <span className="absolute inset-0 rounded-[var(--density-radius)] bg-primary opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-20"></span>

              <span className="relative z-10">Sign Up</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;