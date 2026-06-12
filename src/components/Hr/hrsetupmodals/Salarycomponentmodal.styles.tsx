import React from "react";
import { Info } from "lucide-react";

export const STYLES = `
@keyframes sc-fadein {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sc-fadein { animation: sc-fadein 0.15s ease forwards; }

/* No scroll on body — content sizes the modal */
.sc-body { overflow: visible; }

/* Two-column layout: left content + right attributes */
.sc-layout {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 20px;
  align-items: start;
}

/* Left: plain vertical stack, no scroll */
.sc-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Right: plain, no sticky, no scroll — attributes just render */
.sc-right { display: flex; flex-direction: column; }

/* ── Row 1: Type | Name | Abbr | Description ── */
.sc-row1 {
  display: grid;
  grid-template-columns: 2fr 4fr 1.8fr 4fr;
  gap: 14px;
  align-items: end;
}

/* ── Amount Configuration ── */
.sc-amount-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sc-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111827;
  margin: 0 0 14px 0;
}
.sc-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sc-toggle-pill {
  display: flex;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 4px;
  flex-shrink: 0;
}
.sc-toggle-pill button {
  padding: 4px 14px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  line-height: 1.4;
  white-space: nowrap;
}
.sc-toggle-pill button.active {
  background: #1e3a8a;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.sc-toggle-input {
  flex: 1;
  min-width: 120px;
  font-size: 13px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  outline: none;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  height: 38px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
.sc-toggle-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.sc-toggle-input::placeholder { color: #9ca3af; }

/* ── Ledger section ── */
.sc-ledger-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sc-sec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}
.sc-ledger-row { display: flex; align-items: flex-end; gap: 8px; }
.sc-ledger-row + .sc-ledger-row {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

/* ── Attributes panel ── */
.sc-attrs-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sc-attrs-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #374151;
  margin: 0 0 16px 0;
}

/* ── Attribute row ── */
.sc-attr-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}
.sc-attr-row:last-child { border-bottom: none; }

.sc-attr-cb {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  position: relative;
  transition: border-color 0.1s, background 0.1s;
}
.sc-attr-cb:checked { background: #2563eb; border-color: #2563eb; }
.sc-attr-cb:focus { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
.sc-attr-cb:checked::after {
  content: '';
  position: absolute;
  left: 4px; top: 1px;
  width: 5px; height: 9px;
  border: 2px solid #fff;
  border-top: none; border-left: none;
  transform: rotate(45deg);
}
.sc-attr-cb:disabled { opacity: 0.35; cursor: not-allowed; }

.sc-attr-content { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.sc-attr-label-row { display: flex; align-items: center; gap: 5px; }
.sc-attr-label {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  line-height: 1.3;
}
.sc-attr-label.disabled { color: #9ca3af; cursor: not-allowed; }
.sc-attr-info { color: #9ca3af; flex-shrink: 0; }
.sc-attr-info:hover { color: #6b7280; }
.sc-attr-desc { font-size: 11.5px; color: #6b7280; line-height: 1.45; }
.sc-attr-desc.disabled { color: #d1d5db; }

/* ── Benefit config section ── */
.sc-benefit-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sc-benefit-check-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #f3f4f6;
}
.sc-benefit-check-row:last-child { border-bottom: none; }
.sc-benefit-check-row input[type="checkbox"] {
  width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;
  border-radius: 3px; border: 1.5px solid #d1d5db; background: #fff;
  appearance: none; -webkit-appearance: none;
  cursor: pointer; position: relative;
  transition: border-color 0.1s, background 0.1s;
}
.sc-benefit-check-row input[type="checkbox"]:checked {
  background: #2563eb; border-color: #2563eb;
}
.sc-benefit-check-row input[type="checkbox"]:checked::after {
  content: ''; position: absolute; left: 3px; top: 0px;
  width: 5px; height: 9px;
  border: 2px solid #fff; border-top: none; border-left: none;
  transform: rotate(45deg);
}
.sc-benefit-check-row label {
  font-size: 13px; font-weight: 500; color: #1f2937;
  cursor: pointer; line-height: 1.4;
}
  .sc-formula-input {
  min-height: 90px;
  height: auto;
  resize: vertical;
  line-height: 1.5;
  white-space: pre-wrap;
  padding-top: 10px;
}
`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
interface AttrRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export const AttrRow: React.FC<AttrRowProps> = ({
  id, label, description, checked, onChange, disabled = false,
}) => (
  <div className="sc-attr-row">
    <input
      type="checkbox"
      id={id}
      className="sc-attr-cb"
      checked={checked}
      disabled={disabled}
      onChange={(e) => !disabled && onChange(e.target.checked)}
    />
    <div className="sc-attr-content">
      <div className="sc-attr-label-row">
        <label htmlFor={id} className={`sc-attr-label${disabled ? " disabled" : ""}`}>
          {label}
        </label>
        <span className="sc-attr-info" title={description}>
          <Info size={13} />
        </span>
      </div>
      <span className={`sc-attr-desc${disabled ? " disabled" : ""}`}>{description}</span>
    </div>
  </div>
);

export const BenefitCb: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="sc-benefit-check-row">
    <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <label htmlFor={id}>{label}</label>
  </div>
);