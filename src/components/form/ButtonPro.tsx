import { motion } from "framer-motion";

export default function ButtonPro({
  children,
  loading,
  fullWidth = true,
  type = "button",
  onClick,
  disabled,
  className = "",
}: any) {
  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      className={`
        ${fullWidth ? "w-full" : ""}
        rounded-xl py-4 font-semibold text-white
        flex items-center justify-center gap-2
        transition-all duration-200
        bg-gradient-to-br from-[#204385] to-[#3b5b9e]
        hover:shadow-lg
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {loading ? "Loading..." : children}
      <span className="text-sm">→</span>
    </motion.button>
  );
}