import React, { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom";
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  const [visible, setVisible] = useState(false);

  const posClass =
    position === "top"
      ? "bottom-full mb-1"
      : "top-full mt-1";

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${posClass}
          whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg`}
          style={{ zIndex: 9999 }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;