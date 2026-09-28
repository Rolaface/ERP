import React from "react";

export interface DrawerAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  disabledTitle?: string;
  variant?: "primary" | "default";
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number | string;
  icon?: React.ReactNode;
  kicker?: string; 
  title?: React.ReactNode; 
  statusLabel?: string;
  statusClassName?: string; 
  headerActions?: DrawerAction[];
  loading?: boolean;
  loadingText?: string;
  overlay?: React.ReactNode; 
  footer?: React.ReactNode;
  children?: React.ReactNode;
  scrollBody?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  width = "min(620px, 100vw)",
  icon,
  kicker,
  title,
  statusLabel,
  statusClassName = "bg-draft",
  headerActions,
  loading,
  loadingText = "Loading...",
  overlay,
  footer,
  children,scrollBody = true,
}) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          animation: "idm-fade .15s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          width,
          background: "var(--card)",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
          animation: "idm-slide .2s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes idm-fade  { from{opacity:0}to{opacity:1} }
          @keyframes idm-slide { from{transform:translateX(48px);opacity:0}to{transform:translateX(0);opacity:1} }
          @keyframes idm-up    { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
          @keyframes idm-spin  { to{transform:rotate(360deg)} }
          .idm-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .idm-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .idm-btn:active { transform:translateY(0) }
          .idm-irow:hover { background: var(--row-hover) }
          .idm-trow:hover { background: var(--row-hover) }
        `}</style>

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--card)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {icon && (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ lineHeight: 1, minWidth: 0 }}>
              {kicker && (
                <p
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 2,
                  }}
                >
                  {kicker}
                </p>
              )}
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </p>
            </div>
            {statusLabel && (
              <span
                className={`idm-btn ${statusClassName}`}
                style={{ cursor: "default", padding: "2px 9px", fontSize: 10, borderRadius: 20 }}
              >
                {statusLabel}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {headerActions?.map((action) =>
  action.href ? (
    <a
      key={action.key}
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      className="idm-btn"
      style={{
        background:
          action.variant === "primary"
            ? "var(--primary)"
            : "var(--bg)",
        color:
          action.variant === "primary"
            ? "#fff"
            : "var(--text)",
        border:
          action.variant === "primary"
            ? "none"
            : "1px solid var(--border)",
        textDecoration: "none",
      }}
    >
      {action.icon}
      {action.label}
    </a>
  ) : (
    <button
      key={action.key}
      className="idm-btn"
      onClick={action.disabled ? undefined : action.onClick}
      disabled={action.disabled}
      title={action.disabled ? action.disabledTitle : undefined}
      style={{
        background:
          action.variant === "primary"
            ? "var(--primary)"
            : "var(--bg)",
        color:
          action.variant === "primary"
            ? "#fff"
            : "var(--text)",
        border:
          action.variant === "primary"
            ? "none"
            : "1px solid var(--border)",
        opacity: action.disabled ? 0.5 : 1,
        cursor: action.disabled ? "not-allowed" : "pointer",
      }}
    >
      {action.icon}
      {action.label}
    </button>
  ),
)}
            <button
              onClick={onClose}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
         <div
         style={{
           flex: 1,
           overflowY: scrollBody ? "auto" : "hidden",
           display: scrollBody ? "block" : "flex",
           flexDirection: scrollBody ? undefined : "column",
           minHeight: 0,
           padding: "10px 14px",
           position: "relative",
         }}
      >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 180,
                gap: 10,
                color: "var(--muted)",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                style={{ animation: "idm-spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 13 }}>{loadingText}</span>
            </div>
          ) : (
         scrollBody ? (
             <>
               {children}
               <div style={{ height: 12 }} />
             </>
           ) : (
             children
           )
          )}
        </div>

        {/* ── OPTIONAL OVERLAY (PDF preview style panel) ── */}
        {overlay}

        {/* ── FOOTER ── */}
        {footer && (
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              background: "var(--card)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer;