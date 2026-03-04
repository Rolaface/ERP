import React, { useEffect, useState } from "react";
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
import Swal from "sweetalert2";

import type { BasicDetailsForm } from "../../types/company";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

import { updateCompanyById } from "../../api/companySetupApi";

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

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  placeholder?: string;
  colSpan?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  icon: Icon,
  required = false,
  placeholder = "",
  colSpan = 1,
  value,
  onChange,
}) => {
  const colClass = colSpan >= 2 ? "md:col-span-2" : "";
  const id = `input_${name}`;

  return (
    <div className={`relative ${colClass}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-main mb-1.5"
      >
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4 pointer-events-none z-10" />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full border border-theme rounded-lg ${
            Icon ? "pl-10" : "pl-3.5"
          } pr-3.5 py-2.5 text-sm focus:outline-none bg-card text-main`}
        />
      </div>
    </div>
  );
};

interface BasicDetailsProps {
  basic?: BasicDetailsForm | null;
}

const BasicDetails: React.FC<BasicDetailsProps> = ({ basic }) => {
  const [activeTab, setActiveTab] = useState("registration");

  const [form, setForm] = useState<BasicDetailsForm>(() => ({
    registration: {
      ...defaultForm.registration,
      ...(basic?.registration || {}),
    },
    contact: {
      ...defaultForm.contact,
      ...(basic?.contact || {}),
    },
    address: {
      ...defaultForm.address,
      ...(basic?.address || {}),
    },
  }));

  useEffect(() => {
    if (basic) {
      setForm((prev) => ({
        registration: {
          ...prev.registration,
          ...(basic.registration || {}),
        },
        contact: {
          ...prev.contact,
          ...(basic.contact || {}),
        },
        address: {
          ...prev.address,
          ...(basic.address || {}),
        },
      }));
    }
  }, [basic]);

  const handleChange = (
    section: keyof BasicDetailsForm,
    key: string,
    value: string,
  ) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
      return updated;
    });
  };

  const mapFormToApiPayload = (form: BasicDetailsForm) => ({
    registrationNumber: form.registration.registerNo,
    tpin: form.registration.tpin,
    companyName: form.registration.companyName,
    companyType: form.registration.companyType,
    companyStatus: form.registration.companyStatus,
    dateOfIncorporation: form.registration.dateOfIncorporation,
    industryType: form.registration.industryType,

    contactInfo: {
      companyEmail: form.contact.companyEmail,
      companyPhone: form.contact.companyPhone,
      alternatePhone: form.contact.alternatePhone,
      website: form.contact.website,
      contactPerson: form.contact.contactPerson,
      contactEmail: form.contact.contactEmail,
      contactPhone: form.contact.contactPhone,
    },

    address: {
      addressLine1: form.address.addressLine1,
      addressLine2: form.address.addressLine2,
      city: form.address.city,
      district: form.address.district,
      province: form.address.province,
      postalCode: form.address.postalCode,
      country: form.address.country,
      timeZone: form.address.timeZone,
    },
  });

  const handleSubmit = async () => {
    const payload = {
      id: COMPANY_ID,
      ...mapFormToApiPayload(form),
    };

    try {
      showLoading("Saving Company Details...");

      await updateCompanyById(payload);

      closeSwal();
      showSuccess("Company basic details updated successfully.");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reset All Fields?",
      text: "This will clear all entered data.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reset",
    });

    if (!result.isConfirmed) return;

    setForm(defaultForm);
    showSuccess("Form reset successfully.");
  };

  const renderField = (
    label: string,
    name: string,
    section: keyof BasicDetailsForm,
    options: Partial<InputFieldProps> = {},
  ) => {
    return (
      <InputField
        key={name}
        label={label}
        name={name}
        value={(form[section] as Record<string, string>)[name]}
        onChange={(e) => handleChange(section, name, e.target.value)}
        {...options}
      />
    );
  };

  const tabs = [
    { id: "registration", label: "Registration", icon: FaFileAlt },
    { id: "contact", label: "Contact Info", icon: FaPhone },
    { id: "address", label: "Address", icon: FaMapMarkerAlt },
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
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                    active ? "table-head text-table-head-text" : "text-main"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === "registration" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Registration No", "registerNo", "registration", {
                icon: FaIdCard,
              })}
              {renderField("Tax Id / TPIN", "tpin", "registration", {
                icon: FaIdCard,
              })}
              {renderField("Company Name", "companyName", "registration", {
                icon: FaBuilding,
                required: true,
              })}
              {renderField(
                "Date of Incorporation",
                "dateOfIncorporation",
                "registration",
                { type: "date", icon: FaCalendarAlt },
              )}
              {renderField("Company Type", "companyType", "registration", {
                icon: FaBuilding,
              })}
              {renderField("Company Status", "companyStatus", "registration")}
              {renderField("Industry Type", "industryType", "registration", {
                icon: FaIndustry,
              })}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Company Email", "companyEmail", "contact", {
                icon: FaEnvelope,
                required: true,
              })}
              {renderField("Company Phone", "companyPhone", "contact", {
                icon: FaPhone,
              })}
              {renderField("Alternate Phone", "alternatePhone", "contact", {
                icon: FaPhone,
              })}
              {renderField("Website", "website", "contact", { icon: FaGlobe })}
              {renderField("Contact Person", "contactPerson", "contact", {
                icon: FaUser,
              })}
              {renderField("Contact Email", "contactEmail", "contact", {
                icon: FaEnvelope,
              })}
              {renderField("Contact Phone", "contactPhone", "contact", {
                icon: FaPhone,
              })}
            </div>
          )}

          {activeTab === "address" && (
            <div className="grid grid-cols-3 gap-6">
              {renderField("Address Line 1", "addressLine1", "address", {
                colSpan: 2,
                icon: FaMapMarkerAlt,
              })}
              {renderField("Address Line 2", "addressLine2", "address", {
                colSpan: 2,
              })}
              {renderField("City", "city", "address")}
              {renderField("District", "district", "address")}
              {renderField("Province", "province", "address")}
              {renderField("Country", "country", "address")}
              {renderField("Postal Code", "postalCode", "address")}
              {renderField("Time Zone", "timeZone", "address")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card px-8 py-4 border-t border-theme flex justify-between">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-lg border flex items-center gap-2"
          >
            <FaUndo className="w-4 h-4" />
            Reset All
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-primary text-white flex items-center gap-2"
          >
            <FaSave className="w-4 h-4" />
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicDetails;
