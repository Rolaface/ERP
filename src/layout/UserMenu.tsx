import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";

interface Props {
  variant?: "default" | "sidebar";
}

const UserMenu: React.FC<Props> = ({ variant = "default" }) => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔹 SIDEBAR VERSION (no dropdown, no second U)
  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={logout}
        className="p-2 rounded-lg text-danger hover:bg-row-hover transition"
        title="Logout"
      >
        <FaSignOutAlt />
      </button>
    );
  }

  // 🔹 DEFAULT VERSION (Dashboard dropdown)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="w-10 h-10 rounded-full bg-primary text-white font-bold shadow-sm"
        title="User"
        onClick={() => setOpen((s) => !s)}
      >
        U
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-card border border-theme rounded-xl shadow-lg overflow-hidden z-50">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-main hover:bg-app transition"
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
