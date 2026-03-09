import React from "react";
import Modal from "../../ui/modal/modal";
import { BulkUploadZone }       from "./Bulkuploadzone";
import { useStockCorrection }   from "../../../types/Usestockcorrection";
import { ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSubmit?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const BulkUploadModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const correction = useStockCorrection(isOpen, onSubmit, onClose);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={correction.handleClose}
      title="Bulk Stock Upload"
      subtitle="Import multiple stock corrections at once via CSV or Excel"
      maxWidth="5xl"
      height="88vh"
    >
      <div className="h-full flex flex-col" style={{ background: "var(--bg-app, #f9f6f1)" }}>

        {/* ── Audit badge strip ─────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-6 py-2.5 flex items-center justify-end"
          style={{
            background: "var(--bg-card, #ffffff)",
            borderBottom: "1px solid var(--border, #e8e0d5)",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
            style={{
              background: "rgba(201,125,46,0.06)",
              border: "1px solid rgba(201,125,46,0.18)",
              color: "var(--text-muted, #9a8c7e)",
            }}
          >
            <ShieldCheck size={13} style={{ color: "var(--primary, #c97d2e)" }} strokeWidth={2} />
            <span>All imports are logged with timestamp &amp; user</span>
          </div>
        </div>

        {/* ── Bulk upload content ───────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <BulkUploadZone
            rows        ={correction.bulkRows}
            onRowsChange={correction.setBulkRows}
            onSubmit    ={correction.handleBulkSubmit}
            loading     ={correction.bulkLoading}
          />
        </div>

      </div>
    </Modal>
  );
};

export default BulkUploadModal;