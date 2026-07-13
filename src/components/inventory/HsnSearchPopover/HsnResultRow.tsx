import React from "react";
import { Folder, Tag, Check, ChevronRight } from "lucide-react";
import { HSNNode, HSNLeaf } from "./hsnTreeUtils";

interface HsnResultRowProps {
  item: HSNNode | HSNLeaf;
  index: number;
  mode: "browse" | "search";
  isActive: boolean;
  isCurrentSelection: boolean;
  onHover: () => void;
  onActivate: () => void;
}

const HsnResultRow: React.FC<HsnResultRowProps> = ({
  item,
  index,
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
      data-index={index}
      aria-selected={isActive}
      onMouseEnter={onHover}
      onClick={onActivate}
      className={`row-hover mx-1.5 my-0.5 flex items-center gap-2 rounded border-l-2 border-transparent px-2 py-1.5 cursor-pointer transition-colors ${
        isActive ? "" : ""
      }`}
      style={
        isActive
          ? { borderLeftColor: "var(--primary)", background: "var(--row-hover)" }
          : undefined
      }
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