import React from "react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { BulkUploadZone } from "./Inventoryuploadzone";
import { useStockCorrection } from "../../../types/Usestockcorrection";
import { ShieldCheck, Upload } from "lucide-react";
import { useInventoryImport } from "../../../hooks/inventory/useInventoryImport";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

const ImportInventoryModal: React.FC<Props> = ({ modalId, isOpen, onClose, onSubmit }) => {
    const importHook = useInventoryImport(onSubmit, onClose);  
  const correction = useStockCorrection(isOpen, onSubmit, onClose);

  if (!isOpen) return null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={correction.handleClose}
      title="Bulk Stock Upload"
      subtitle="Import multiple stock corrections at once via CSV or Excel"
      icon={Upload}
      maxWidth="5xl"
      height="88vh"
    >
      <div className="flex h-full flex-col" style={{ background: "var(--bg-app, #f9f6f1)" }}>
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

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
           <BulkUploadZone
            rows={importHook.bulkRows}
            onRowsChange={importHook.setBulkRows}
            onSubmit={importHook.handleBulkSubmit}
            loading={importHook.bulkLoading}
          />
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ImportInventoryModal;