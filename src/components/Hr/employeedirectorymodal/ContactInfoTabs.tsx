import React from "react";

type ContactInfoTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
};

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const formatZmPhone = (raw: string): string => {
    const s = String(raw ?? "").replace(/\s+/g, "");
    const leadingPlus = s.startsWith("+");
    const digits = s.replace(/\D/g, "");

    if (!digits) return "";

    // If user types +260..., keep it.
    if (leadingPlus) return `+${digits}`;

    // If they typed 260..., normalize to +260...
    if (digits.startsWith("260")) return `+${digits}`;

    // If they typed a local number starting with 0, convert to +260 (drop leading 0)
    if (digits.startsWith("0")) return `+260${digits.slice(1)}`;

    // If they typed 9 digits (common for ZM mobile without leading 0), prefix +260
    if (digits.length === 9) return `+260${digits}`;

    // Fallback: still prefix +260
    return `+260${digits}`;
  };

  const phonePlaceholder = "e.g., 0977123456 or 0771234567";

  const relationshipOptions = [
    "Spouse",
    "Parent",
    "Sibling",
    "Child",
    "Relative",
    "Friend",
    "Guardian",
    "Other",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Contact Information */}
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Contact Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Personal Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="e.g., name@gmail.com"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Company Email *<span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.CompanyEmail}
              onChange={(e) =>
                handleInputChange("CompanyEmail", e.target.value)
              }
              placeholder="@company.co.zm"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Phone Number * <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                handleInputChange("phoneNumber", formatZmPhone(e.target.value))
              }
              placeholder={phonePlaceholder}
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) =>
                handleInputChange(
                  "alternatePhone",
                  formatZmPhone(e.target.value),
                )
              }
              placeholder={phonePlaceholder}
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Address
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Street Address
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) =>
                handleInputChange(
                  "street",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              placeholder="Plot number, street name"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  handleInputChange(
                    "city",
                    String(e.target.value ?? "").toUpperCase(),
                  )
                }
                placeholder="Enter city"
                className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                Province
              </label>
              <select
                value={formData.province}
                onChange={(e) => handleInputChange("province", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select</option>
                <option>Central Province</option>
                <option>Copperbelt Province</option>
                <option>Eastern Province</option>
                <option>Luapula Province</option>
                <option>Lusaka Province</option>
                <option>Muchinga Province</option>
                <option>Northern Province</option>
                <option>North-Western Province</option>
                <option>Southern Province</option>
                <option>Western Province</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange(
                    "postalCode",
                    String(e.target.value ?? "").toUpperCase(),
                  )
                }
                placeholder="Enter postal code"
                className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Emergency Contact
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Name *<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.emergencyContactName}
              onChange={(e) =>
                handleInputChange(
                  "emergencyContactName",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              placeholder="Enter contact name"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Phone *<span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) =>
                handleInputChange(
                  "emergencyContactPhone",
                  formatZmPhone(e.target.value),
                )
              }
              placeholder={phonePlaceholder}
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Relationship
            </label>
            <select
              value={formData.emergencyContactRelationship}
              onChange={(e) =>
                handleInputChange(
                  "emergencyContactRelationship",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoTab;
