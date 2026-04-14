import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";


type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonWidth = "full" | "wide" | "auto";

type ButtonProProps = {
  children: React.ReactNode;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth | string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export default function ButtonPro({
  children,
  loading = false,
  variant = "primary",
  size = "md",
  width = "full",
  type = "button",
  onClick,
  disabled,
  className = "",
  leftIcon,
  rightIcon,
}: ButtonProProps) {
  /* ---------------- WIDTH ---------------- */
  const widthClass =
    width === "full"
      ? "w-full"
      : width === "wide"
      ? "w-[80%] mx-auto"
      : width === "auto"
      ? "w-auto"
      : width;

  /* ---------------- VARIANTS ---------------- */
  const variantClass =
    variant === "primary"
      ? "bg-gradient-to-br from-[#204385] to-[#3b5b9e] text-white hover:shadow-lg"
      : variant === "secondary"
      ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
      : "bg-transparent text-gray-700 hover:bg-gray-100";

  /* ---------------- SIZES ---------------- */
  const sizeClass =
    size === "sm"
      ? "py-2 px-3 text-sm"
      : size === "lg"
      ? "py-5 px-6 text-lg"
      : "py-4 px-5 text-base";

  /* ---------------- DISABLED STATE ---------------- */
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      className={`
        ${widthClass}
        ${variantClass}
        ${sizeClass}
        rounded-xl font-semibold
        flex items-center justify-center gap-2
        transition-all duration-200
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {/* LEFT ICON / LOADER */}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}

      {/* TEXT */}
      <span>{children}</span>

      {/* RIGHT ICON */}
      {!loading && (rightIcon ?? <span className="text-sm">→</span>)}
    </motion.button>
  );
}