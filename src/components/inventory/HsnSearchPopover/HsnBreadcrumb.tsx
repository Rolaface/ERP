import React from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface HsnBreadcrumbProps {
  breadcrumb: string[];
  path: string[];
  onNavigate: (path: string[]) => void;
  onBack: () => void;
}

const HsnBreadcrumb: React.FC<HsnBreadcrumbProps> = ({
  breadcrumb,
  path,
  onNavigate,
  onBack,
}) => (
  <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 border-b border-theme text-[11px]">
    <button
      onClick={() => onNavigate([])}
      className="shrink-0 px-1.5 py-0.5 rounded text-muted hover:text-main"
    >
      All
    </button>
    {breadcrumb.map((name, i) => (
      <React.Fragment key={i}>
        <ChevronRight size={10} className="shrink-0 text-muted" />
        <button
          onClick={() => onNavigate(path.slice(0, i + 1))}
          className={`shrink-0 px-1.5 py-0.5 rounded ${
            i === breadcrumb.length - 1
              ? "font-medium text-primary"
              : "text-muted hover:text-main"
          }`}
        >
          {name}
        </button>
      </React.Fragment>
    ))}
    <button
      onClick={onBack}
      className="ml-auto flex shrink-0 items-center gap-1 text-muted hover:text-main"
    >
      <ArrowLeft size={10} /> Back
    </button>
  </div>
);

export default HsnBreadcrumb;