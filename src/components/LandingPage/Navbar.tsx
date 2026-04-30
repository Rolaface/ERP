import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Customers", href: "#customers" },
  { name: "Demo", href: "#demo" },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);

  const ticking = useRef(false);

  // Scroll handling
  useEffect(() => {
    const updateScroll = () => {
      const scrollY = window.scrollY;

      setIsScrolled(scrollY > 8);

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollY / docHeight) * 100;
      setScrollProgress(progress);

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScroll);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    updateScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      {
        rootMargin: "-40% 0px -50% 0px",
        threshold: 0,
      }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.querySelector(item.href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    const y =
      target.getBoundingClientRect().top + window.scrollY - 70;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[60]">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`
          sticky top-0 z-50 w-full
          floating-dock border-b border-theme
          transition-all duration-[var(--motion-base)] ease-[var(--ease-smooth)]
          ${isScrolled ? "shadow-sm" : ""}
        `}
      >
        <div
          className={`
            container-app flex items-center justify-between
            transition-all duration-[var(--motion-base)]
            ${isScrolled ? "h-14" : "h-16"}
          `}
        >
          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className="
                w-10 h-10 flex items-center justify-center
                rounded-[var(--density-radius)]
                bg-primary text-white font-bold
                interactive-lift
              "
            >
              ERP
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-main tracking-tight group-hover:text-primary transition-colors">
                RolafaceERP
              </span>
              <span className="text-[10px] text-muted hidden md:block">
                Trusted by 500+ businesses
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="relative group px-1 py-1 link"
                >
                  <span
                    className={`
                      transition-colors
                      ${isActive ? "text-main" : "text-muted group-hover:text-main"}
                    `}
                  >
                    {item.name}
                  </span>

                  {/* Active underline */}
                  <span
                    className={`
                      absolute left-0 -bottom-1 h-[2px] w-full bg-primary
                      origin-left transition-transform duration-[var(--motion-fast)]
                      ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                    `}
                  />
                </a>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden md:block text-sm font-medium text-muted hover:text-main transition-colors"
            >
              Login
            </Link>

            <Link to="/signup">
              <button className="btn btn-primary btn-premium">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;