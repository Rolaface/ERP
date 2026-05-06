// ui.tsx — Shared UI primitives: Input, Select, MinibleModal, Btn, Toast
// Drop-in replacements your own component library versions.

import React, { useEffect, useRef } from "react";
import { X, CheckCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// BTN
// ─────────────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "outline" | "success" | "ghost" | "danger";
type BtnSize    = "sm" | "md";

export const Btn: React.FC<{
  onClick?:   () => void;
  disabled?:  boolean;
  children:   React.ReactNode;
  icon?:      React.ReactNode;
  variant?:   BtnVariant;
  size?:      BtnSize;
  type?:      "button" | "submit";
  className?: string;
}> = ({ onClick, disabled, children, icon, variant = "primary", size = "md", type = "button", className = "" }) => {
  const v: Record<BtnVariant, string> = {
    primary: "bg-primary text-white hover:opacity-90 shadow-sm",
    outline: "bg-card text-main border border-theme hover:bg-app",
    success: "bg-success text-white hover:opacity-90 shadow-sm",
    ghost:   "text-muted hover:text-main hover:bg-app",
    danger:  "bg-danger text-white hover:opacity-90 shadow-sm",
  };
  const s = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed ${v[variant]} ${s} ${className}`}
    >
      {icon}{children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────────
interface InputProps {
  label?:       string;
  value:        string | number;
  onChange:     (v: string) => void;
  type?:        "text" | "number" | "date" | "email";
  placeholder?: string;
  disabled?:    boolean;
  required?:    boolean;
  error?:       string;
  hint?:        string;
  className?:   string;
}

export const Input: React.FC<InputProps> = ({
  label, value, onChange, type = "text",
  placeholder, disabled, required, error, hint, className = "",
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-main">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2.5 text-sm bg-card border rounded-lg text-main placeholder:text-muted
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? "border-danger focus:ring-danger/30 focus:border-danger" : "border-theme"}`}
    />
    {hint  && !error && <p className="text-[11px] text-muted">{hint}</p>}
    {error &&          <p className="text-[11px] text-danger font-medium">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string }

interface SelectProps {
  label?:     string;
  value:      string;
  onChange:   (v: string) => void;
  options:    SelectOption[] | string[];
  disabled?:  boolean;
  required?:  boolean;
  error?:     string;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label, value, onChange, options, disabled, required, error, placeholder, className = "",
}) => {
  const normalised: SelectOption[] = options.map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-main">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm bg-card border rounded-lg text-main
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition
          disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer
          ${error ? "border-danger" : "border-theme"}`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {normalised.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-danger font-medium">{error}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MINIBLE MODAL — lightweight, accessible, focus-trapped modal shell
// ─────────────────────────────────────────────────────────────────────────────
interface MinibleModalProps {
  open:         boolean;
  onClose:      () => void;
  title:        string;
  subtitle?:    string;
  children:     React.ReactNode;
  footer?:      React.ReactNode;
  size?:        "sm" | "md" | "lg" | "xl";
  /** Prevent closing on backdrop click */
  strict?:      boolean;
}

const MODAL_SIZE: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const MinibleModal: React.FC<MinibleModalProps> = ({
  open, onClose, title, subtitle, children, footer, size = "md", strict = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !strict) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, strict]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (!strict && e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`w-full ${MODAL_SIZE[size]} bg-card border border-theme rounded-2xl shadow-2xl
          flex flex-col max-h-[90vh] animate-[modalIn_0.18s_ease]`}
        style={{ animation: "modalIn 0.18s cubic-bezier(.16,1,.3,1)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-theme shrink-0">
          <div>
            <h2 className="text-base font-bold text-main">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {!strict && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-app transition ml-4 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-theme px-6 py-4 bg-app rounded-b-2xl flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
export interface ToastState { msg: string; type: "success" | "error" | "info" }

export const Toast: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  const colors = {
    success: "bg-success text-white",
    error:   "bg-danger  text-white",
    info:    "bg-primary text-white",
  };
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold ${colors[toast.type]}`}
      style={{ animation: "slideUp 0.2s ease" }}>
      <CheckCircle className="w-4 h-4 shrink-0" />
      {toast.msg}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD LABEL + VALUE — read-only display pair
// ─────────────────────────────────────────────────────────────────────────────
export const FieldDisplay: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?:  boolean;
}> = ({ label, value, mono }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">{label}</p>
    <p className={`text-sm font-semibold text-main ${mono ? "font-mono tabular-nums" : ""}`}>{value}</p>
  </div>
);