import React from "react";
import { Download, RefreshCw } from "lucide-react";
import { actionBtnCls } from "./Styles";

interface Props {
  title: string;
  loading: boolean;
  canExport: boolean;
  onExport: () => void;
  onRefresh: () => void;
}

const SummaryHeader: React.FC<Props> = ({ title, loading, canExport, onExport, onRefresh }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-main">{title}</h1>
      <p className="text-xs text-muted">
        Track project progress, task completion and identify projects that need attention.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <button onClick={onExport} disabled={!canExport} className={actionBtnCls}>
        <Download size={13} />
        Export
      </button>
      <button onClick={onRefresh} disabled={loading} className={actionBtnCls}>
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  </div>
);

export default SummaryHeader;