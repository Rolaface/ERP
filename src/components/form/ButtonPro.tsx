import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type ButtonProProps = {
  children: React.ReactNode;

  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;

  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  fullWidth?: boolean;
  type?: "button" | "submit";
};

export default function ButtonPro({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = "button",
}: ButtonProProps) {
  const isDisabled = disabled || loading;

  /* ---------------- Variant Styles ---------------- */
  const base =
    "rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group";

  const variants = {
    primary: isDisabled
      ? "bg-primary/40 text-white/70 cursor-not-allowed"
      : "bg-primary text-white shadow-md hover:shadow-lg",
    secondary: isDisabled
      ? "bg-muted text-muted/60 cursor-not-allowed"
      : "bg-muted text-foreground hover:bg-muted/80",
    ghost: isDisabled
      ? "text-muted/50 cursor-not-allowed"
      : "text-foreground hover:bg-muted/50",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  /* ---------------- Motion ---------------- */
  const motionProps = !isDisabled
    ? {
        whileTap: { scale: 0.97 },
        whileHover: { scale: 1.02 },
      }
    : {};

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      {...motionProps}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {/* Left Icon */}
      {leftIcon && !loading && (
        <span className="flex items-center justify-center">
          {leftIcon}
        </span>
      )}

      {/* Text */}
      <span className="whitespace-nowrap">{children}</span>

      {/* Right Icon / Loader */}
      <span className="flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          rightIcon && (
            <span
              className={`
                transition-transform duration-200
                ${!isDisabled ? "group-hover:translate-x-1" : ""}
              `}
            >
              {rightIcon}
            </span>
          )
        )}
      </span>
    </motion.button>
  );
}