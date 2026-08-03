
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface RowExpandToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const RowExpandToggle: React.FC<RowExpandToggleProps> = ({ isExpanded, onToggle }) => (
  <button onClick={onToggle} className="text-muted hover:text-main">
    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
  </button>
);

export default RowExpandToggle;