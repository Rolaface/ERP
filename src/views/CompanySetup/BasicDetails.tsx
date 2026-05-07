import React, { useEffect, useRef, useState } from "react";
import CountrySelect from "../../components/selects/CountrySelect";
import {
  FaBuilding,
  FaCalendarAlt,
  FaEnvelope,
  FaGlobe,
  FaIdCard,
  FaIndustry,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaFileAlt,
  FaSave,
  FaUndo,
} from "react-icons/fa";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import { fireManagedSwal } from "../../utils/swalManager";

import type { BasicDetailsForm } from "../../types/company";
import type { Terms } from "../../types/termsAndCondition";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import { updateCompanyById } from "../../api/companySetupApi";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const dmy = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmy) {
    const mm = MONTHS.findIndex((m) => m.toLowerCase() === dmy[2].toLowerCase());
    if (mm !== -1) return new Date(Number(dmy[3]), mm, Number(dmy[1]));
  }
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatISO(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

function formatDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  return `${dd}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

// ─── DateInput ────────────────────────────────────────────────────────────────

const DateInput: React.FC<{
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, name, value, onChange }) => {
  const [raw, setRaw] = useState("");
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setRaw(""); }, [value]);

  const displayValue = (() => {
    if (raw.length > 0 && raw.length < 8) return raw;
    if (raw.length === 0) {
      const d = parseDate(value);
      return d ? formatDisplay(d) : "";
    }
    return raw;
  })();

  const emit = (isoDate: string) =>
    onChange({ target: { name, value: isoDate } } as React.ChangeEvent<HTMLInputElement>);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === "") { setRaw(""); emit(""); return; }
    const digits = input.replace(/\D/g, "");
    setRaw(digits);
    if (digits.length === 8) {
      const dd   = digits.slice(0, 2);
      const mm   = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (!isNaN(date.getTime())) {
        setRaw(formatDisplay(date));
        emit(formatISO(date));
      }
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) { setRaw(""); emit(""); return; }
    const d = parseDate(iso);
    if (d) { setRaw(formatDisplay(d)); emit(iso); }
  };

  return (
    <div className="flex w-full">
      <input
        id={id}
        type="text"
        placeholder="ddmmyyyy  e.g. 01022025"
        value={displayValue}
        onChange={handleTextChange}
        maxLength={10}
        className="w-full border border-theme rounded-l-lg pl-3.5 pr-3.5 py-2.5 text-sm focus:outline-none bg-card text-main"
      />
      <button
        type="button"
        onClick={() => hiddenRef.current?.showPicker?.()}
        className="px-3 border border-l-0 border-theme rounded-r-lg bg-card hover:bg-app transition-colors flex items-center"
        title="Pick from calendar"
      >
        <FaCalendarAlt className="w-4 h-4 text-muted" />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value || ""}
        onChange={handleCalendarChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};

// ─── Default Form ─────────────────────────────────────────────────────────────

const defaultForm: BasicDetailsForm = {
  registration: {
    registerNo: "",
    tpin: "",
    companyName: "",
    dateOfIncorporation: "",
    companyType: "",
    companyStatus: "",
    industryType: "",
  },
  contact: {
    companyEmail: "",
    companyPhone: "",
    alternatePhone: "",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  },
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    province: "",
    postalCode: "",
    country: "",
    timeZone: "",
  },
};

// ─── InputField ───────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  placeholder?: string;
  colSpan?: number;
  value: string;
  options?: { label: string; value: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label, name, type = "text", icon: Icon,
  required = false, placeholder = "", colSpan = 1,
  value, options, onChange,
}) => {
  const colClass = colSpan >= 2 ? "md:col-span-2" : "";
  const id = `input_${name}`;

  return (
    <div className={`relative ${colClass}`}>
      <label htmlFor={id} className="block text-sm font-medium text-main mb-1.5">
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>

      <div className="relative">
        {Icon && type !== "date" && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4 pointer-events-none z-10" />
        )}

        {options ? (
          <select
            id={id} value={value} onChange={onChange as any} required={required}
            className={`w-full border border-theme rounded-lg ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm focus:outline-none bg-card text-main`}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

        ) : type === "date" ? (
  <DatePickerInput
    name={name}
    value={value}
    onChange={(name, value) =>
      onChange({
        target: { name, value },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    sx={{
      "& .MuiOutlinedInput-root": {
        height: "40px",
        fontSize: "14px",
        borderRadius: "8px",
        paddingRight: "10px",
      },
      "& .MuiOutlinedInput-input": {
        padding: "10px 14px",
      },
    }}
  />
) : (
          <input
            id={id} type={type} value={value} onChange={onChange}
            placeholder={placeholder} required={required}
            className={`w-full border border-theme rounded-lg ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm focus:outline-none bg-card text-main`}
          />
        )}
      </div>
    </div>
  );
};

// ─── BasicDetails ─────────────────────────────────────────────────────────────

interface BasicDetailsProps {
  basic?: BasicDetailsForm | null;
  terms?: Terms | null;          
  onSaveSuccess: () => void;
}

const BasicDetails: React.FC<BasicDetailsProps> = ({ basic, terms, onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState("registration");

  const [form, setForm] = useState<BasicDetailsForm>(() => ({
    registration: { ...defaultForm.registration, ...(basic?.registration || {}) },
    contact:      { ...defaultForm.contact,      ...(basic?.contact      || {}) },
    address:      { ...defaultForm.address,      ...(basic?.address      || {}) },
  }));

  useEffect(() => {
    if (basic) {
      setForm((prev) => ({
        registration: { ...prev.registration, ...(basic.registration || {}) },
        contact:      { ...prev.contact,      ...(basic.contact      || {}) },
        address:      { ...prev.address,      ...(basic.address      || {}) },
      }));
    }
  }, [basic]);

  const handleChange = (section: keyof BasicDetailsForm, key: string, value: string) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };


  const basePayload = () => ({
    id: COMPANY_ID,
    ...(terms !== undefined && terms !== null ? { terms } : {}),
  });

  const mapFormToApiPayload = (form: BasicDetailsForm) => ({
    registrationNumber:  form.registration.registerNo,
    tpin:                form.registration.tpin,
    companyName:         form.registration.companyName,
    companyType:         form.registration.companyType,
    companyStatus:       form.registration.companyStatus,
    dateOfIncorporation: form.registration.dateOfIncorporation,
    industryType:        form.registration.industryType,
    contactInfo: {
      companyEmail:   form.contact.companyEmail,
      companyPhone:   form.contact.companyPhone,
      alternatePhone: form.contact.alternatePhone,
      website:        form.contact.website,
      contactPerson:  form.contact.contactPerson,
      contactEmail:   form.contact.contactEmail,
      contactPhone:   form.contact.contactPhone,
    },
    address: {
      addressLine1: form.address.addressLine1,
      addressLine2: form.address.addressLine2,
      city:         form.address.city,
      district:     form.address.district,
      province:     form.address.province,
      postalCode:   form.address.postalCode,
      country:      form.address.country,
      timeZone:     form.address.timeZone,
    },
  });

  const handleSubmit = async () => {
    // ✅ basePayload() includes terms — backend will never wipe it
    const payload = {
      ...basePayload(),
      ...mapFormToApiPayload(form),
    };
    try {
      showLoading("Saving Company Details...");
      await updateCompanyById(payload);
      onSaveSuccess();
      closeSwal();
      showSuccess("Company basic details updated successfully.");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleReset = async () => {
    const result = await fireManagedSwal({
      icon: "warning", title: "Reset All Fields?",
      text: "This will clear all entered data.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reset",
    });
    if (!result.isConfirmed) return;
    setForm(defaultForm);
    showSuccess("Form reset successfully.");
  };

  const renderField = (
    label: string, name: string,
    section: keyof BasicDetailsForm,
    options: Partial<InputFieldProps> = {},
  ) => (
    <InputField
      key={name} label={label} name={name}
      value={(form[section] as Record<string, string>)[name]}
      onChange={(e) => handleChange(section, name, e.target.value)}
      {...options}
    />
  );

  const tabs = [
    { id: "registration", label: "Registration", icon: FaFileAlt },
    { id: "contact",      label: "Contact Info", icon: FaPhone },
    { id: "address",      label: "Address",      icon: FaMapMarkerAlt },
  ];

  return (
    <div className="w-full">
      <div className="bg-card rounded-xl shadow-sm border border-theme overflow-hidden">

        {/* Tabs */}
        <div className="border-b border-theme bg-[var(--card)]">
          <div className="flex">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                    active ? "table-head text-table-head-text" : "text-main"}`}
                >
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === "registration" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Registration No",       "registerNo",          "registration", { icon: FaIdCard })}
              {renderField("Tax Id / TPIN",         "tpin",                "registration", { icon: FaIdCard })}
              {renderField("Company Name",          "companyName",         "registration", { icon: FaBuilding, required: true })}
              {renderField("Date of Incorporation", "dateOfIncorporation", "registration", { type: "date", icon: FaCalendarAlt })}
              {renderField("Company Type", "companyType", "registration", {
                icon: FaBuilding,
                options: [
                  { label: "Private Limited", value: "PRIVATE_LIMITED" },
                  { label: "Public Limited",  value: "PUBLIC_LIMITED"  },
                  { label: "Partnership",     value: "PARTNERSHIP"     },
                ],
              })}
              {/* {renderField("Company Status", "companyStatus", "registration", {
                options: [
                  { label: "Active",   value: "ACTIVE"   },
                  { label: "Inactive", value: "INACTIVE" },
                ],
              })} */}
              {renderField("Industry Type", "industryType", "registration", {
                icon: FaIndustry,
                options: [
                  { label: "Manufacturing", value: "MANUFACTURING" },
                  { label: "Retail",        value: "RETAIL"        },
                  { label: "Wholesale",     value: "WHOLESALE"     },
                  { label: "IT / Software", value: "IT_SOFTWARE"   },
                  { label: "Healthcare",    value: "HEALTHCARE"    },
                ],
              })}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Company Email",   "companyEmail",   "contact", { icon: FaEnvelope, required: true })}
              {renderField("Company Phone",   "companyPhone",   "contact", { icon: FaPhone })}
              {renderField("Alternate Phone", "alternatePhone", "contact", { icon: FaPhone })}
              {renderField("Website",         "website",        "contact", { icon: FaGlobe })}
              {renderField("Contact Person",  "contactPerson",  "contact", { icon: FaUser })}
              {renderField("Contact Email",   "contactEmail",   "contact", { icon: FaEnvelope })}
              {renderField("Contact Phone",   "contactPhone",   "contact", { icon: FaPhone })}
            </div>
          )}

          {activeTab === "address" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Address Line 1", "addressLine1", "address", { colSpan: 2, icon: FaMapMarkerAlt })}
              {renderField("Address Line 2", "addressLine2", "address", { colSpan: 2 })}
              {renderField("City",        "city",       "address")}
              {renderField("District",    "district",   "address")}
              {renderField("Province",    "province",   "address")}
              {renderField("Country",     "country",    "address")}
              {renderField("Postal Code", "postalCode", "address")}
              {renderField("Time Zone",   "timeZone",   "address")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card px-8 py-4 border-t border-theme flex justify-between">
          <button onClick={handleReset} className="px-5 py-2.5 rounded-lg border flex items-center gap-2">
            <FaUndo className="w-4 h-4" /> Reset All
          </button>
          <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg bg-primary text-white flex items-center gap-2">
            <FaSave className="w-4 h-4" /> Save All Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default BasicDetails;
