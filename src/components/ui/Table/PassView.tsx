import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PassViewProps {
  value?: string | number | null;
  visibleChars?: number;
  className?: string;
}

const maskValue = (
  value?: string | number | null,
  visibleChars: number = 4,
) => {
  if (value === null || value === undefined || value === "") return "—";

  const str = String(value);

  if (str.length <= visibleChars) {
    return "*".repeat(str.length);
  }

  return (
    "*".repeat(str.length - visibleChars) +
    str.slice(-visibleChars)
  );
};

const PassView: React.FC<PassViewProps> = ({
  value,
  visibleChars = 4,
  className = "",
}) => {
  const [show, setShow] = useState(false);

  if (value === null || value === undefined || value === "") {
    return <span>—</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>
        {show
          ? String(value)
          : maskValue(value, visibleChars)}
      </span>

      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        {show ? (
          <EyeOff size={16} />
        ) : (
          <Eye size={16} />
        )}
      </button>
    </div>
  );
};

export default PassView;