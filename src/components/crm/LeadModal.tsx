// src/components/modals/LeadModal.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/ui/modal/modal";
import {
  Input,
  Card,
  Button,
  Textarea,
} from "../../components/ui/modal/formComponent";
import {
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  Banknote,
  Users,
  Image as ImageIcon,
  Check,
} from "lucide-react";

export interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any | null;
  onSubmit: (data: any) => void;
}

export interface LeadFormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;

  title?: string;
  leadSource?: string;
  leadStatus?: string;
  annualRevenue?: number;
  noOfEmployees?: number;

  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  description?: string;
  file?: File | null;
}

const emptyForm: LeadFormData = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  title: "",
  leadSource: "",
  leadStatus: "",
  annualRevenue: undefined,
  noOfEmployees: undefined,
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  description: "",
  file: null,
};

type TabType = "basic" | "company" | "address" | "notes";

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value === "" ? undefined : value }));
  };

  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value === "" ? undefined : Number(value),
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, file: e.target.files?.[0] || null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(form);
    setForm(emptyForm);
    onClose();
  };

  const tabs = [
    { id: "basic" as TabType, label: "Basic Info", icon: User },
    { id: "company" as TabType, label: "Company", icon: Building2 },
    { id: "address" as TabType, label: "Address", icon: MapPin },
    { id: "notes" as TabType, label: "Notes", icon: FileText },
  ];

  // Footer content
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setForm(emptyForm)}>
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          icon={<Check className="w-4 h-4" />}
        >
          Save Lead
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lead"
      subtitle="Fill in the details to create a new lead"
      icon={User}
      footer={footer}
      maxWidth="5xl"
      height="calc(100vh - 80px)"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 -mx-6 -mt-6 px-6 pt-4 bg-app">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 font-semibold text-sm transition-all duration-200 rounded-t-lg ${
                  activeTab === tab.id
                    ? "text-primary bg-card shadow-sm"
                    : "text-muted hover:text-main hover:bg-card/50"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeLeadTab"
                    className="absolute inset-0 bg-card rounded-t-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "basic" && (
              <Card
                title="Basic Information"
                subtitle="Essential lead details"
                icon={<User className="w-5 h-5 text-primary" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter first name"
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter last name"
                  />
                  <Input
                    label="Company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    required
                    icon={<Building2 className="w-4 h-4" />}
                    placeholder="Company name"
                  />
                  <Input
                    label="Job Title"
                    name="title"
                    value={form.title || ""}
                    onChange={handleChange}
                    icon={<Briefcase className="w-4 h-4" />}
                    placeholder="Position"
                  />
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="+1234567890"
                  />

                  {/* Lead Source Select */}
                  <label className="flex flex-col gap-2 text-sm w-full group">
                    <span className="font-semibold text-muted group-focus-within:text-primary transition-colors">
                      Lead Source
                    </span>
                    <select
                      name="leadSource"
                      value={form.leadSource || ""}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-[#e5e7eb] dark:border-[#1e293b] px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all bg-card text-main hover:border-[#d1d5db] dark:hover:border-[#334155]"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(35, 124, 169, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      <option value="">-- None --</option>
                      <option value="Web">Web</option>
                      <option value="Phone">Phone Inquiry</option>
                      <option value="Partner">Partner Referral</option>
                      <option value="Purchased List">Purchased List</option>
                    </select>
                  </label>

                  {/* Lead Status Select */}
                  <label className="flex flex-col gap-2 text-sm w-full group">
                    <span className="font-semibold text-muted group-focus-within:text-primary transition-colors">
                      Lead Status
                    </span>
                    <select
                      name="leadStatus"
                      value={form.leadStatus || ""}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-[#e5e7eb] dark:border-[#1e293b] px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all bg-card text-main hover:border-[#d1d5db] dark:hover:border-[#334155]"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(35, 124, 169, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      <option value="">-- None --</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </label>
                </div>
              </Card>
            )}

            {activeTab === "company" && (
              <Card
                title="Company Details"
                subtitle="Financial and organizational information"
                icon={<Building2 className="w-5 h-5 text-primary" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Annual Revenue"
                    type="number"
                    name="annualRevenue"
                    value={form.annualRevenue ?? ""}
                    onChange={handleNumber}
                    placeholder="e.g. 500000"
                    icon={<Banknote className="w-4 h-4" />}
                  />
                  <Input
                    label="No. of Employees"
                    type="number"
                    name="noOfEmployees"
                    value={form.noOfEmployees ?? ""}
                    onChange={handleNumber}
                    placeholder="e.g. 50"
                    icon={<Users className="w-4 h-4" />}
                  />
                </div>
              </Card>
            )}

            {activeTab === "address" && (
              <Card
                title="Address Information"
                subtitle="Location details"
                icon={<MapPin className="w-5 h-5 text-primary" />}
              >
                <div className="space-y-4">
                  <Input
                    label="Street"
                    name="street"
                    value={form.street || ""}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={form.city || ""}
                      onChange={handleChange}
                      placeholder="City"
                    />
                    <Input
                      label="State"
                      name="state"
                      value={form.state || ""}
                      onChange={handleChange}
                      placeholder="State"
                    />
                    <Input
                      label="Zip Code"
                      name="zipCode"
                      value={form.zipCode || ""}
                      onChange={handleChange}
                      placeholder="ZIP"
                    />
                  </div>
                  <Input
                    label="Country"
                    name="country"
                    value={form.country || ""}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
              </Card>
            )}

            {activeTab === "notes" && (
              <Card
                title="Additional Information"
                subtitle="Notes and attachments"
                icon={<FileText className="w-5 h-5 text-primary" />}
              >
                <div className="space-y-5">
                  <Textarea
                    label="Description / Notes"
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    placeholder="Any additional notes about the lead..."
                    icon={<FileText className="w-4 h-4" />}
                    rows={5}
                  />

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-muted mb-2">
                      <ImageIcon className="w-4 h-4" />
                      Lead Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="block w-full text-sm text-muted
                        file:mr-4 file:py-2.5 file:px-5 
                        file:rounded-lg file:border-0 
                        file:text-sm file:font-semibold 
                        file:bg-primary file:text-white 
                        hover:file:opacity-90 file:transition-all
                        cursor-pointer border-2 border-dashed border-[#e5e7eb] dark:border-[#1e293b] rounded-lg p-3"
                    />
                    {form.file && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-main bg-[var(--row-hover)] px-3 py-2 rounded-lg">
                        <Check className="w-4 h-4 text-primary" />
                        Selected: {form.file.name}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </Modal>
  );
};

export default LeadModal;
