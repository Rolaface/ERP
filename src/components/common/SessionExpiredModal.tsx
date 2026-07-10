import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { onSessionExpired } from "../../utils/sessionEvents"; 

const SessionExpiredModal = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => setOpen(true));
    return unsubscribe;
  }, []);

  const handleOk = () => {
    setOpen(false);
    navigate("/login", { replace: true });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/20 backdrop-blur-md"
    >
      <div
        className="p-8 rounded-3xl w-[380px] text-center relative"
        style={{
          background: "linear-gradient(160deg, rgba(235,242,255,0.96) 0%, rgba(218,232,252,0.94) 100%)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 24px 64px rgba(80,120,180,0.20), inset 0 1px 0 rgba(255,255,255,1)",
        }}
      >
        <div className="flex justify-center mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h2 className="text-[18px] font-bold mb-2" style={{ color: "#0f1f3d" }}>
          Session Expired
        </h2>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#5a7199" }}>
          Your session has expired for security reasons.<br />Please log in again to continue.
        </p>

        <button
          onClick={handleOk}
          className="w-full py-3 rounded-2xl text-[13px] font-bold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
          }}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

export default SessionExpiredModal;