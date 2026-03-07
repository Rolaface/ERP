import React, { useState } from "react";
import {
  Eye,
  Plus,
  Save,
  Download,
  Settings,
  FileText,
  Palette,
  Layout,
  Check,
} from "lucide-react";

const SalarySlipSetup = () => {
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");

  const [templates] = useState([
    {
      id: "professional",
      name: "Professional Template",
      color: "#2563eb",
      preview: "Corporate blue theme with clean layout",
    },
    {
      id: "modern",
      name: "Modern Template",
      color: "#7c3aed",
      preview: "Purple gradient with contemporary design",
    },
    {
      id: "classic",
      name: "Classic Template",
      color: "#059669",
      preview: "Traditional green business style",
    },
    {
      id: "minimal",
      name: "Minimal Template",
      color: "#dc2626",
      preview: "Simple red accent, content-focused",
    },
  ]);

  const [visibleSections, setVisibleSections] = useState({
    companyLogo: true,
    companyDetails: true,
    employeePhoto: false,
    employeeDetails: true,
    employmentInfo: true,
    payPeriod: true,
    earningsSection: true,
    deductionsSection: true,
    netSalary: true,
    bankDetails: true,
    ytdSummary: true,
    signature: true,
    footer: true,
    watermark: false,
  });

  const [earningsDisplay, setEarningsDisplay] = useState([
    { id: 1, name: "Basic Salary", visible: true, showFormula: false },
    { id: 2, name: "House Allowance", visible: true, showFormula: false },
    { id: 3, name: "Transport Allowance", visible: true, showFormula: false },
    { id: 4, name: "Medical Allowance", visible: true, showFormula: false },
    { id: 5, name: "Special Allowance", visible: false, showFormula: false },
    { id: 6, name: "Overtime", visible: false, showFormula: true },
    { id: 7, name: "Bonus", visible: false, showFormula: false },
    { id: 8, name: "Commission", visible: false, showFormula: true },
  ]);

  const [deductionsDisplay, setDeductionsDisplay] = useState([
    {
      id: 1,
      name: "NAPSA (5%)",
      visible: true,
      showFormula: true,
      statutory: true,
    },
    { id: 2, name: "PAYE", visible: true, showFormula: true, statutory: true },
    {
      id: 3,
      name: "NHIMA",
      visible: true,
      showFormula: false,
      statutory: true,
    },
    {
      id: 4,
      name: "Professional Tax",
      visible: true,
      showFormula: false,
      statutory: false,
    },
    {
      id: 5,
      name: "Loan Deduction",
      visible: false,
      showFormula: false,
      statutory: false,
    },
    {
      id: 6,
      name: "Advance Salary",
      visible: false,
      showFormula: false,
      statutory: false,
    },
  ]);

  const [companySettings, setCompanySettings] = useState({
    name: "Rolaface software Pvt Ltd",
    address: "123 Business Park, Tech City, Lusaka",
    phone: "+260 211 123456",
    email: "hr@techsolutions.zm",
    tpin: "TPIN1234567890",
    napsa: "NAPSA123456",
    showLogo: true,
  });

  const [layoutSettings, setLayoutSettings] = useState({
    fontSize: "medium",
    spacing: "comfortable",
    orientation: "portrait",
    showGridLines: false,
    pageBreaks: "auto",
    colorScheme: "color",
  });

  const [sampleData] = useState({
    employee: {
      name: "John Mukwasa Phiri",
      id: "EMP001",
      designation: "Senior Developer",
      department: "Engineering",
      level: "Senior",
      doj: "01/01/2020",
      bankAccount: "Zambia National Commercial Bank - ****1234",
      nrc: "123456/78/9",
      napsa: "NAPSA789012",
      tpin: "TPIN9876543210",
    },
    period: {
      month: "December 2024",
      payDate: "31/12/2024",
      workingDays: 22,
      present: 20,
      leave: 2,
      absent: 0,
    },
    earnings: [
      { name: "Basic Salary", amount: 12000, formula: "60% of Gross" },
      { name: "House Allowance", amount: 4000, formula: "20% of Gross" },
      { name: "Transport Allowance", amount: 3000, formula: "15% of Gross" },
      { name: "Medical Allowance", amount: 500, formula: "Fixed" },
    ],
    deductions: [
      {
        name: "NAPSA (5%)",
        amount: 600,
        formula: "5% of Basic",
        statutory: true,
      },
      {
        name: "PAYE",
        amount: 2450,
        formula: "Tax Slab Applied",
        statutory: true,
      },
      { name: "NHIMA", amount: 100, formula: "1% of Gross", statutory: true },
      {
        name: "Professional Tax",
        amount: 50,
        formula: "Fixed",
        statutory: false,
      },
    ],
    totals: {
      grossSalary: 19500,
      totalDeductions: 3200,
      netSalary: 16300,
    },
    ytd: {
      grossEarned: 234000,
      totalDeducted: 38400,
      netPaid: 195600,
    },
  });

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleEarning = (id: number, field?: "visible" | "showFormula") => {
    setEarningsDisplay((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field || "visible"]: !item[field || "visible"] }
          : item,
      ),
    );
  };

  const toggleDeduction = (id: number, field?: "visible" | "showFormula") => {
    setDeductionsDisplay((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field || "visible"]: !item[field || "visible"] }
          : item,
      ),
    );
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  const handleSaveConfiguration = () => {
    const config = {
      template: selectedTemplate,
      sections: visibleSections,
      earnings: earningsDisplay,
      deductions: deductionsDisplay,
      company: companySettings,
      layout: layoutSettings,
    };
    alert(" Salary slip configuration saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                Salary Slip Configuration
              </h1>
              <p className="text-gray-600 mt-1">
                Design and customize employee salary slip templates with live
                preview
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveConfiguration}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md">
                <Download className="w-4 h-4" />
                Export Sample
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 180px)" }}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {["template", "sections", "earnings", "deductions", "layout"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 font-medium text-sm transition-colors capitalize ${
                      activeTab === tab
                        ? "text-purple-600 border-b-2 border-purple-600 bg-white"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {tab === "template" && (
                      <Palette className="w-4 h-4 inline mr-2" />
                    )}
                    {tab === "sections" && (
                      <Layout className="w-4 h-4 inline mr-2" />
                    )}
                    {tab === "earnings" && (
                      <Plus className="w-4 h-4 inline mr-2" />
                    )}
                    {tab === "layout" && (
                      <Settings className="w-4 h-4 inline mr-2" />
                    )}
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template Selection */}
              {activeTab === "template" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Select Salary Slip Template
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedTemplate === template.id
                              ? "border-purple-500 bg-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-12 h-12 rounded-lg"
                              style={{ backgroundColor: template.color }}
                            />
                            {selectedTemplate === template.id && (
                              <Check className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {template.preview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Company Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companySettings.name}
                          aria-label="Company Name"
                          title="Company Name"
                          onChange={(e) =>
                            setCompanySettings({
                              ...companySettings,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={companySettings.address}
                          aria-label="Address"
                          title="Address"
                          onChange={(e) =>
                            setCompanySettings({
                              ...companySettings,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={companySettings.phone}
                            aria-label="Phone"
                            title="Phone"
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={companySettings.email}
                            aria-label="Email"
                            title="Email"
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            TPIN
                          </label>
                          <input
                            type="text"
                            value={companySettings.tpin}
                            aria-label="TPIN"
                            title="TPIN"
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                tpin: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            NAPSA Number
                          </label>
                          <input
                            type="text"
                            value={companySettings.napsa}
                            aria-label="NAPSA Number"
                            title="NAPSA Number"
                            onChange={(e) =>
                              setCompanySettings({
                                ...companySettings,
                                napsa: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Visibility */}
              {activeTab === "sections" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-purple-600" />
                      Section Visibility Control
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Toggle which sections appear on the salary slip
                    </p>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(visibleSections).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${value ? "bg-green-500" : "bg-gray-300"}`}
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`${value ? "Hide" : "Show"} ${key.replace(/([A-Z])/g, " $1").trim()} section`}
                          title={`${value ? "Hide" : "Show"} ${key.replace(/([A-Z])/g, " $1").trim()} section`}
                          onClick={() =>
                            toggleSection(key as keyof typeof visibleSections)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            value ? "bg-purple-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Earnings Configuration */}
              {activeTab === "earnings" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Earnings Components Display
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure which earning components and formulas to show
                    </p>
                  </div>

                  <div className="space-y-3">
                    {earningsDisplay.map((earning) => (
                      <div
                        key={earning.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                toggleEarning(earning.id, "visible")
                              }
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                                earning.visible
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {earning.visible && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span className="font-medium text-gray-800">
                              {earning.name}
                            </span>
                          </div>
                          {earning.visible && (
                            <Eye className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {earning.visible && (
                          <div className="ml-8 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={earning.showFormula}
                              aria-label={`Show calculation formula for ${earning.name}`}
                              title={`Show calculation formula for ${earning.name}`}
                              onChange={() =>
                                toggleEarning(earning.id, "showFormula")
                              }
                              className="rounded"
                            />
                            <label className="text-gray-600">
                              Show calculation formula
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions Configuration */}
              {activeTab === "deductions" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Deductions Components Display
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure which deduction components and formulas to show
                    </p>
                  </div>

                  <div className="space-y-3">
                    {deductionsDisplay.map((deduction) => (
                      <div
                        key={deduction.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                toggleDeduction(deduction.id, "visible")
                              }
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                                deduction.visible
                                  ? "bg-red-500 border-red-500"
                                  : "border-gray-300"
                              }`}
                              disabled={deduction.statutory}
                            >
                              {deduction.visible && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span className="font-medium text-gray-800">
                              {deduction.name}
                            </span>
                            {deduction.statutory && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Statutory
                              </span>
                            )}
                          </div>
                          {deduction.visible && (
                            <Eye className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {deduction.visible && !deduction.statutory && (
                          <div className="ml-8 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={deduction.showFormula}
                              aria-label={`Show calculation formula for ${deduction.name}`}
                              title={`Show calculation formula for ${deduction.name}`}
                              onChange={() =>
                                toggleDeduction(deduction.id, "showFormula")
                              }
                              className="rounded"
                            />
                            <label className="text-gray-600">
                              Show calculation formula
                            </label>
                          </div>
                        )}
                        {deduction.statutory && (
                          <div className="ml-8 text-xs text-gray-500 mt-1">
                            ⚠️ Statutory deductions are mandatory and always
                            visible
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout Settings */}
              {activeTab === "layout" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Layout & Print Settings
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <select
                        value={layoutSettings.fontSize}
                        aria-label="Font Size"
                        title="Font Size"
                        onChange={(e) =>
                          setLayoutSettings({
                            ...layoutSettings,
                            fontSize: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="small">Small (10pt)</option>
                        <option value="medium">Medium (12pt)</option>
                        <option value="large">Large (14pt)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spacing
                      </label>
                      <select
                        value={layoutSettings.spacing}
                        aria-label="Spacing"
                        title="Spacing"
                        onChange={(e) =>
                          setLayoutSettings({
                            ...layoutSettings,
                            spacing: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="spacious">Spacious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Orientation
                      </label>
                      <select
                        value={layoutSettings.orientation}
                        aria-label="Page Orientation"
                        title="Page Orientation"
                        onChange={(e) =>
                          setLayoutSettings({
                            ...layoutSettings,
                            orientation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Scheme
                      </label>
                      <select
                        value={layoutSettings.colorScheme}
                        aria-label="Color Scheme"
                        title="Color Scheme"
                        onChange={(e) =>
                          setLayoutSettings({
                            ...layoutSettings,
                            colorScheme: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="color">Full Color</option>
                        <option value="grayscale">Grayscale</option>
                        <option value="blackwhite">Black & White</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Show Grid Lines
                        </label>
                        <button
                          type="button"
                          aria-label={`${layoutSettings.showGridLines ? "Hide" : "Show"} grid lines`}
                          title={`${layoutSettings.showGridLines ? "Hide" : "Show"} grid lines`}
                          onClick={() =>
                            setLayoutSettings({
                              ...layoutSettings,
                              showGridLines: !layoutSettings.showGridLines,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            layoutSettings.showGridLines
                              ? "bg-purple-600"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              layoutSettings.showGridLines
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h3 className="font-semibold">preview</h3>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-lg">
                <span>{currentTemplate?.name}</span>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ height: "calc(100vh - 240px)" }}
            >
              <div
                className="bg-white shadow-xl mx-auto p-8 rounded-lg"
                style={{
                  maxWidth:
                    layoutSettings.orientation === "portrait"
                      ? "800px"
                      : "100%",
                  borderColor: currentTemplate?.color,
                  borderWidth: "4px",
                }}
              >
                {/* Header */}
                {visibleSections.companyDetails && (
                  <div
                    className="border-b-2 pb-4 mb-4"
                    style={{ borderColor: currentTemplate?.color }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1
                          className="text-2xl font-bold mb-1"
                          style={{ color: currentTemplate?.color }}
                        >
                          {companySettings.name}
                        </h1>
                        <p className="text-sm text-gray-600">
                          {companySettings.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          📞 {companySettings.phone} | ✉️{" "}
                          {companySettings.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          TPIN: {companySettings.tpin} | NAPSA:{" "}
                          {companySettings.napsa}
                        </p>
                      </div>
                      {visibleSections.companyLogo && (
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
                          style={{
                            backgroundColor: currentTemplate?.color + "20",
                          }}
                        >
                          🏢
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Slip Title */}
                <div
                  className="text-center py-3 mb-4 rounded-lg"
                  style={{ backgroundColor: currentTemplate?.color + "10" }}
                >
                  <h2
                    className="text-xl font-bold"
                    style={{ color: currentTemplate?.color }}
                  >
                    SALARY SLIP
                  </h2>
                  {visibleSections.payPeriod && (
                    <p className="text-sm text-gray-600 mt-1">
                      Pay Period: {sampleData.period.month} | Pay Date:{" "}
                      {sampleData.period.payDate}
                    </p>
                  )}
                </div>

                {/* Employee Details */}
                {visibleSections.employeeDetails && (
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Employee Name</p>
                      <p className="font-semibold text-gray-900">
                        {sampleData.employee.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Employee ID</p>
                      <p className="font-semibold text-gray-900">
                        {sampleData.employee.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Designation</p>
                      <p className="font-semibold text-gray-900">
                        {sampleData.employee.designation}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-semibold text-gray-900">
                        {sampleData.employee.department}
                      </p>
                    </div>
                    {visibleSections.employmentInfo && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">NRC Number</p>
                          <p className="font-semibold text-gray-900">
                            {sampleData.employee.nrc}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">NAPSA Number</p>
                          <p className="font-semibold text-gray-900">
                            {sampleData.employee.napsa}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Earnings Section */}
                {visibleSections.earningsSection && (
                  <div className="mb-6">
                    <div
                      className="px-4 py-2 rounded-t-lg"
                      style={{ backgroundColor: currentTemplate?.color }}
                    >
                      <h3 className="font-semibold text-white">EARNINGS</h3>
                    </div>
                    <div className="border border-t-0 rounded-b-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-gray-600 font-medium">
                              Component
                            </th>
                            {earningsDisplay.some(
                              (e) => e.visible && e.showFormula,
                            ) && (
                              <th className="text-left py-2 px-4 text-gray-600 font-medium">
                                Formula
                              </th>
                            )}
                            <th className="text-right py-2 px-4 text-gray-600 font-medium">
                              Amount (ZMW)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.earnings.map((earning, idx) => {
                            const config = earningsDisplay.find(
                              (e) => e.name === earning.name,
                            );
                            if (!config?.visible) return null;

                            return (
                              <tr key={idx} className="border-t">
                                <td className="py-2 px-4 text-gray-800">
                                  {earning.name}
                                </td>
                                {config.showFormula && (
                                  <td className="py-2 px-4 text-gray-600 text-xs italic">
                                    {earning.formula}
                                  </td>
                                )}
                                {!config.showFormula &&
                                  earningsDisplay.some(
                                    (e) => e.visible && e.showFormula,
                                  ) && <td className="py-2 px-4"></td>}
                                <td className="py-2 px-4 text-right font-semibold text-gray-900">
                                  {earning.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-t-2 bg-gray-50 font-bold">
                            <td
                              className="py-3 px-4"
                              style={{ color: currentTemplate?.color }}
                            >
                              GROSS SALARY
                            </td>
                            {earningsDisplay.some(
                              (e) => e.visible && e.showFormula,
                            ) && <td></td>}
                            <td
                              className="py-3 px-4 text-right text-lg"
                              style={{ color: currentTemplate?.color }}
                            >
                              {sampleData.totals.grossSalary.toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Deductions Section */}
                {visibleSections.deductionsSection && (
                  <div className="mb-6">
                    <div className="px-4 py-2 rounded-t-lg bg-red-600">
                      <h3 className="font-semibold text-white">DEDUCTIONS</h3>
                    </div>
                    <div className="border border-t-0 rounded-b-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-gray-600 font-medium">
                              Component
                            </th>
                            {deductionsDisplay.some(
                              (d) => d.visible && d.showFormula,
                            ) && (
                              <th className="text-left py-2 px-4 text-gray-600 font-medium">
                                Formula
                              </th>
                            )}
                            <th className="text-right py-2 px-4 text-gray-600 font-medium">
                              Amount (ZMW)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.deductions.map((deduction, idx) => {
                            const config = deductionsDisplay.find(
                              (d) => d.name === deduction.name,
                            );
                            if (!config?.visible) return null;

                            return (
                              <tr key={idx} className="border-t">
                                <td className="py-2 px-4 text-gray-800 flex items-center gap-2">
                                  {deduction.name}
                                  {deduction.statutory && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                      Statutory
                                    </span>
                                  )}
                                </td>
                                {config.showFormula && (
                                  <td className="py-2 px-4 text-gray-600 text-xs italic">
                                    {deduction.formula}
                                  </td>
                                )}
                                {!config.showFormula &&
                                  deductionsDisplay.some(
                                    (d) => d.visible && d.showFormula,
                                  ) && <td className="py-2 px-4"></td>}
                                <td className="py-2 px-4 text-right font-semibold text-red-600">
                                  {deduction.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-t-2 bg-gray-50 font-bold">
                            <td className="py-3 px-4 text-red-600">
                              TOTAL DEDUCTIONS
                            </td>
                            {deductionsDisplay.some(
                              (d) => d.visible && d.showFormula,
                            ) && <td></td>}
                            <td className="py-3 px-4 text-right text-lg text-red-600">
                              {sampleData.totals.totalDeductions.toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Net Salary */}
                {visibleSections.netSalary && (
                  <div
                    className="mb-6 p-6 rounded-lg"
                    style={{ backgroundColor: currentTemplate?.color + "15" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          NET SALARY (Take Home)
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: currentTemplate?.color }}
                        >
                          ZMW{" "}
                          {sampleData.totals.netSalary.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-600 mt-2 italic">
                          In Words: Sixteen Thousand Three Hundred Kwacha Only
                        </p>
                      </div>
                      <div className="text-5xl opacity-20">💰</div>
                    </div>
                  </div>
                )}

                {/* YTD Summary */}
                {visibleSections.ytdSummary && (
                  <div
                    className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4"
                    style={{ borderColor: currentTemplate?.color }}
                  >
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Year-to-Date Summary (2024)
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">
                          Total Gross Earned
                        </p>
                        <p className="font-bold text-gray-900">
                          ZMW {sampleData.ytd.grossEarned.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Total Deducted</p>
                        <p className="font-bold text-red-600">
                          ZMW {sampleData.ytd.totalDeducted.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Total Net Paid</p>
                        <p
                          className="font-bold"
                          style={{ color: currentTemplate?.color }}
                        >
                          ZMW {sampleData.ytd.netPaid.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {visibleSections.bankDetails && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Payment Details
                    </h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Bank Account:</span>{" "}
                      {sampleData.employee.bankAccount}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Payment Method: Direct Bank Transfer | Processed on{" "}
                      {sampleData.period.payDate}
                    </p>
                  </div>
                )}

                {/* Attendance Summary */}
                {visibleSections.employmentInfo && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Attendance Summary
                    </h4>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Working Days</p>
                        <p className="font-bold text-gray-900">
                          {sampleData.period.workingDays}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Present</p>
                        <p className="font-bold text-green-600">
                          {sampleData.period.present}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Leave</p>
                        <p className="font-bold text-blue-600">
                          {sampleData.period.leave}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Absent</p>
                        <p className="font-bold text-red-600">
                          {sampleData.period.absent}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signature */}
                {visibleSections.signature && (
                  <div className="grid grid-cols-2 gap-8 mb-6 mt-8">
                    <div className="text-center">
                      <div className="">
                        <p className="text-xs text-gray-500 mt-1">
                          Date: ___________
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-300 pt-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Authorized Signatory
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          HR Department
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                {visibleSections.footer && (
                  <div className="border-t pt-4 mt-6 text-center">
                    <p className="text-xs text-gray-500">
                      This is a computer-generated salary slip and does not
                      require a physical signature.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Generated on: {new Date().toLocaleDateString()} |
                      Confidential Document
                    </p>
                  </div>
                )}

                {/* Watermark */}
                {visibleSections.watermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <p
                      className="text-6xl font-bold transform -rotate-45"
                      style={{ color: currentTemplate?.color }}
                    >
                      {companySettings.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>
                {Object.values(visibleSections).filter(Boolean).length} sections
                enabled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>
                {earningsDisplay.filter((e) => e.visible).length} earnings
                visible
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>
                {deductionsDisplay.filter((d) => d.visible).length} deductions
                visible
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirm("Reset all settings to default?")) {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset to Default
            </button>
            <button
              onClick={() =>
                alert(
                  "Preview mode - export functionality would generate PDF here",
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Test Print
            </button>
            <button
              onClick={handleSaveConfiguration}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              Save & Apply Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipSetup;
