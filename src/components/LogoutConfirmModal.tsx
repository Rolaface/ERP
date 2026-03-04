import React from "react";
import { FaSignOutAlt, FaTimes } from "react-icons/fa";

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal Box */}
      <div className="bg-card w-[92%] max-w-md rounded-2xl shadow-2xl border border-[var(--border)]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {/* RED ICON */}
            <div className="w-9 h-9 rounded-xl bg-danger flex items-center justify-center text-white shadow">
              <FaSignOutAlt />
            </div>

            <h2 className="font-bold text-lg text-main">Confirm Logout</h2>
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app transition text-muted hover:text-main"
          >
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 text-sm text-muted leading-relaxed">
          Are you sure you want to logout ?
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-4 border-t border-[var(--border)]">
          {/* CANCEL */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border)]
                       bg-app text-main text-sm font-semibold
                       hover:bg-row-hover transition"
          >
            Cancel
          </button>

          {/* LOGOUT */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl
                       bg-danger text-white
                       text-sm font-semibold shadow
                       hover:opacity-90 active:scale-95 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
