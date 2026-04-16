import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-card/80 backdrop-blur-xl border-b border-theme shadow-md"
          : "bg-card/60 backdrop-blur-lg border-b border-transparent"
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

            {/* Tiny Trust Signal */}
            <span className="text-[10px] text-muted hidden md:block">
              Trusted by 500+ businesses
            </span>
          </div>
        </div>

        {/* CENTER: NAV LINKS */}
        <div className="hidden md:flex items-center gap-[var(--density-gap)] text-sm font-medium text-muted">
          {[
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Customers", href: "#customers" },
            { name: "Demo", href: "#demo" },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="relative group px-1 py-1 transition-colors"
            >
              <span className="transition-colors group-hover:text-main">
                {item.name}
              </span>

              {/* Premium underline (center grow) */}
              <span className="absolute left-1/2 -bottom-1 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </a>
          ))}
        </div>

        {/* RIGHT: LOGIN + CTA */}
        <div className="flex items-center gap-[var(--density-gap)]">
          
          {/* Login (Secondary Action) */}
          <Link
            to="/login"
            className="hidden md:block text-sm font-medium text-muted hover:text-main transition-all duration-200"
          >
            Login
          </Link>

          {/* Sign Up CTA */}
          <Link to="/signup">
            <button className="relative inline-flex items-center justify-center px-[var(--density-padding-lg)] py-[var(--density-padding-sm)] text-sm font-semibold text-white rounded-[var(--density-radius)] bg-primary shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
              
              {/* Glow */}
              <span className="absolute inset-0 rounded-[var(--density-radius)] bg-primary opacity-0 blur-xl transition-opacity duration-300 hover:opacity-30"></span>

              <span className="relative z-10">Sign Up</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;