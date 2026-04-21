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

  /* ---------------- VARIANTS (TOKEN-BASED) ---------------- */
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
      ? "btn-outline"
      : "btn-ghost";

  /* ---------------- SIZES (TOKEN-ALIGNED) ---------------- */
  const sizeClass =
    size === "sm"
      ? "py-2 px-3 text-sm"
      : size === "lg"
      ? "py-5 px-6 text-lg"
      : "py-4 px-5 text-base";

  /* ---------------- DISABLED ---------------- */
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      className={`
        btn
        ${variantClass}
        ${sizeClass}
        ${widthClass}
        flex items-center justify-center gap-2
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