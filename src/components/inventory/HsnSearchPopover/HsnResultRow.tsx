import React from "react";
import { Folder, Tag, Check, ChevronRight } from "lucide-react";
import { HSNNode, HSNLeaf } from "./hsnTreeUtils";

interface HsnResultRowProps {
  item: HSNNode | HSNLeaf;
  mode: "browse" | "search";
  isActive: boolean;
  isCurrentSelection: boolean;
  onHover: () => void;
  onActivate: () => void;
}

const HsnResultRow: React.FC<HsnResultRowProps> = ({
  item,
  mode,
  isActive,
  isCurrentSelection,
  onHover,
  onActivate,
}) => {
  const isLeaf = mode === "search" || !!(item as HSNNode).code;

  return (
    <div
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      onClick={onActivate}
      className={`mx-1.5 my-0.5 flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer row-hover ${
        isActive ? "bg-row-hover" : ""
      }`}
    >
      {isLeaf ? (
        <Tag size={12} className={isActive ? "text-primary" : "text-muted"} />
      ) : (
        <Folder size={12} className={isActive ? "text-primary" : "text-muted"} />
      )}
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[12px] ${isActive ? "font-medium text-primary" : "text-main"}`}>
          {item.name}
        </div>
        {mode === "search" && (item as HSNLeaf).trail.length > 0 && (
          <div className="truncate text-[10px] text-muted">
            {(item as HSNLeaf).trail.join(" › ")}
          </div>
        )}
      </div>
      {isLeaf ? (
        <span className="flex shrink-0 items-center gap-1">
          {isCurrentSelection && <Check size={11} className="text-primary" />}
          <span className={`font-mono text-[10px] ${isActive ? "text-primary" : "text-muted"}`}>
            {(item as HSNLeaf).code}
          </span>
        </span>
      ) : (
        <ChevronRight size={12} className={isActive ? "text-primary" : "text-muted"} />
      )}
    </div>
  );
};

export default HsnResultRow;