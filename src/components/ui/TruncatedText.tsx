import React from "react";
import Tooltip from "../Tooltip";

interface TruncatedTextProps {
  text?: string | null;
  maxWidth?: string;
  className?: string;
  showTooltip?: boolean;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxWidth = "200px",
  className = "",
  showTooltip = true,
}) => {
  const displayValue = text ?? "-";
  
  const content = (
    <span
      className={`inline-block overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
      style={{ maxWidth }}
      title={displayValue}
    >
      {displayValue}
    </span>
  );

  if (!showTooltip || !text) {
    return content;
  }

  return (
    <Tooltip content={displayValue}>
      {content}
    </Tooltip>
  );
};

export default TruncatedText;