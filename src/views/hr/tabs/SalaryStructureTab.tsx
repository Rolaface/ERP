import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Banknote,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  getSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
} from "../../../views/hr/tabs/salarystructure";
import { fireManagedSwal } from "../../../utils/swalManager";
import { confirmDelete } from "../../../api/utils/confirmDelete";
import type { SalaryStructure } from "../../../views/hr/tabs/salarystructure";
import type { SalaryComponent } from "../../../views/hr/tabs/salarystructure";

export default function SalaryStructureTab() {
  const [structures, setStructures] = useState<SalaryStructure[]>(
    getSalaryStructures(),
  );
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] =
    useState<SalaryStructure | null>(null);


  const refreshStructures = () => {
    setStructures(getSalaryStructures());
  };

  const handleCreateNew = () => {
    setEditingStructure({
      id: `struct_${Date.now()}`,
      name: "",
      description: "",
      effectiveFrom: new Date().toISOString().split("T")[0],
      status: "Draft",
      usedBy: 0,
      components: [
        {
          id: `c_${Date.now()}`,
          name: "Basic Salary",
          category: "Earning",
          valueType: "percentage",
          value: 60,
          taxable: true,
          statutory: "NAPSA Base",
        },
      ],
    });
    setShowModal(true);
  };

  const handleEdit = (structure: SalaryStructure) => {
    setEditingStructure(JSON.parse(JSON.stringify(structure)));
    setShowModal(true);
  };

const handleDelete = async (id: string) => {
  const structure = structures.find((s) => s.id === id);

  if (!structure) return;

  if (structure.usedBy > 0) {
    await fireManagedSwal({
      icon: "error",
      title: "Cannot Delete",
      text: `This structure is used by ${structure.usedBy} employees.`,
      confirmButtonColor: "#ef4444",
    });

    return;
  }

  const deleted = await confirmDelete({
    text: `Delete "${structure.name}"?`,
    loadingText: "Deleting Salary Structure...",
    successMessage: "Salary structure deleted",
    action: async () => {
      deleteSalaryStructure(id);
    },
  });

  if (deleted) {
    refreshStructures();
  }
};

  const handleSave = (structure: SalaryStructure) => {
    const existingIndex = structures.findIndex((s) => s.id === structure.id);
    if (existingIndex >= 0) {
      updateSalaryStructure(structure.id, structure);
    } else {
      createSalaryStructure(structure);
    }
    refreshStructures();
    setShowModal(false);
    setEditingStructure(null);
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Salary Structures
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage reusable salary templates
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Structure
        </button>
      </div>

      {/* Structures List */}
      <div className="grid grid-cols-1 gap-4">
        {structures.map((structure) => (
          <StructureCard
            key={structure.id}
            structure={structure}
            onEdit={handleEdit}
           onDelete={() => handleDelete(structure.id)}
          />
        ))}
      </div>

      {structures.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No salary structures created yet</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create Your First Structure
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingStructure && (
        <StructureModal
          structure={editingStructure}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingStructure(null);
          }}
        />
      )}

      
    </div>
  );
}

// Structure Card Component
function StructureCard({
  structure,
  onEdit,
  onDelete,
}: {
  structure: SalaryStructure;
  onEdit: (s: SalaryStructure) => void;
  onDelete: () => void;
}) {
  const totalPercentage = structure.components
    .filter((c) => c.category === "Earning" && c.valueType === "percentage")
    .reduce((sum, c) => sum + (typeof c.value === "number" ? c.value : 0), 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {structure.name}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                structure.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {structure.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{structure.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📊 {structure.components.length} components</span>
            <span>👥 Used by {structure.usedBy} employees</span>
            <span>
              📅 Effective:{" "}
              {new Date(structure.effectiveFrom).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(structure)}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            disabled={structure.usedBy > 0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Component Preview */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Earnings ({totalPercentage}%)
            </p>
            <div className="space-y-1">
              {structure.components
                .filter((c) => c.category === "Earning")
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className="flex justify-between text-xs">
                    <span className="text-gray-600">{c.name}</span>
                    <span className="font-medium">
                      {typeof c.value === "number"
                        ? c.valueType === "percentage"
                          ? `${c.value}%`
                          : `ZMW ${c.value}`
                        : c.value}
                    </span>
                  </div>
                ))}
              {structure.components.filter((c) => c.category === "Earning")
                .length > 3 && (
                <p className="text-xs text-gray-500">
                  +
                  {structure.components.filter((c) => c.category === "Earning")
                    .length - 3}{" "}
                  more...
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Deductions
            </p>
            <div className="space-y-1">
              {structure.components
                .filter((c) => c.category === "Deduction")
                .map((c) => (
                  <div key={c.id} className="flex justify-between text-xs">
                    <span className="text-gray-600">{c.name}</span>
                    <span className="font-medium text-red-600">
                      {typeof c.value === "number"
                        ? c.valueType === "percentage"
                          ? `${c.value}%`
                          : `ZMW ${c.value}`
                        : c.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Structure Modal Component
function StructureModal({
  structure,
  onSave,
  onClose,
}: {
  structure: SalaryStructure;
  onSave: (s: SalaryStructure) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<SalaryStructure>(structure);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<SalaryComponent | null>(null);

  const handleAddComponent = () => {
    setEditingComponent({
      id: `c_${Date.now()}`,
      name: "",
      category: "Earning",
      valueType: "percentage",
      value: 0,
      taxable: true,
    });
    setShowComponentModal(true);
  };

  const handleEditComponent = (component: SalaryComponent) => {
    setEditingComponent(JSON.parse(JSON.stringify(component)));
    setShowComponentModal(true);
  };

  const handleSaveComponent = (component: SalaryComponent) => {
    const existingIndex = formData.components.findIndex(
      (c) => c.id === component.id,
    );
    if (existingIndex >= 0) {
      const updated = [...formData.components];
      updated[existingIndex] = component;
      setFormData({ ...formData, components: updated });
    } else {
      setFormData({
        ...formData,
        components: [...formData.components, component],
      });
    }
    setShowComponentModal(false);
    setEditingComponent(null);
  };

  const handleDeleteComponent = (id: string) => {
    if (confirm("Delete this component?")) {
      setFormData({
        ...formData,
        components: formData.components.filter((c) => c.id !== id),
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter structure name");
      return;
    }
    if (formData.components.length === 0) {
      alert("Please add at least one component");
      return;
    }
    onSave(formData);
  };

  const grossExample = 10000;
  const totalPercentage = formData.components
    .filter((c) => c.category === "Earning" && c.valueType === "percentage")
    .reduce((sum, c) => sum + (typeof c.value === "number" ? c.value : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {structure.id.startsWith("struct_") ? "Create" : "Edit"} Salary
              Structure
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Define components and calculations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left - Form */}
            <div className="col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Structure Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Executive Level, Mid-Level Staff"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Effective From *
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          effectiveFrom: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "Active" | "Draft",
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>
                </div>

                {totalPercentage > 100 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                      Warning: Total percentage earnings ({totalPercentage}%)
                      exceeds 100%
                    </p>
                  </div>
                )}
              </div>

              {/* Components */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Salary Components
                  </h4>
                  <button
                    onClick={handleAddComponent}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Component
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.components.map((component) => (
                    <div
                      key={component.id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {component.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              component.category === "Earning"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {component.category}
                          </span>
                          {component.statutory && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              {component.statutory}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="capitalize">
                            {component.valueType}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {typeof component.value === "number"
                              ? component.valueType === "percentage"
                                ? `${component.value}%`
                                : `ZMW ${component.value}`
                              : component.value}
                          </span>
                          <span>•</span>
                          <span>
                            {component.taxable ? "Taxable" : "Non-taxable"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComponent(component)}
                          className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteComponent(component.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Preview */}
            <div className="col-span-1">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 sticky top-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Preview Calculation
                </h4>

                <div className="bg-white rounded-lg p-4 text-sm space-y-3">
                  <div className="text-center pb-3 border-b">
                    <p className="text-xs text-gray-600">Example for</p>
                    <p className="text-xl font-bold text-gray-900">
                      ZMW {grossExample.toLocaleString()}
                    </p>
                  </div>

                  {/* Earnings */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      EARNINGS:
                    </p>
                    <div className="space-y-1 pl-2">
                      {formData.components
                        .filter((c) => c.category === "Earning")
                        .map((c) => {
                          const amount =
                            typeof c.value === "number"
                              ? c.valueType === "percentage"
                                ? (grossExample * c.value) / 100
                                : c.value
                              : 0;
                          return (
                            <div
                              key={c.id}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-600">{c.name}</span>
                              <span className="font-medium">
                                {amount.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Deductions */}
                  {formData.components.filter((c) => c.category === "Deduction")
                    .length > 0 && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        DEDUCTIONS:
                      </p>
                      <div className="space-y-1 pl-2">
                        {formData.components
                          .filter((c) => c.category === "Deduction")
                          .map((c) => (
                            <div
                              key={c.id}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-600">{c.name}</span>
                              <span className="font-medium text-red-600">
                                Auto-calc
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Structure
          </button>
        </div>

        {/* Component Modal */}
        {showComponentModal && editingComponent && (
          <ComponentModal
            component={editingComponent}
            onSave={handleSaveComponent}
            onClose={() => {
              setShowComponentModal(false);
              setEditingComponent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Component Modal
function ComponentModal({
  component,
  onSave,
  onClose,
}: {
  component: SalaryComponent;
  onSave: (c: SalaryComponent) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<SalaryComponent>(component);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter component name");
      return;
    }
    if (formData.valueType !== "auto" && !formData.value) {
      alert("Please enter value");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {component.id.startsWith("c_") ? "Add" : "Edit"} Component
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Component Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Basic Salary, Transport Allowance"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as "Earning" | "Deduction",
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="Earning">Earning</option>
                <option value="Deduction">Deduction</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Value Type *
              </label>
              <select
                value={formData.valueType}
                onChange={(e) =>
                  setFormData({ ...formData, valueType: e.target.value as any })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="auto">Auto-calculated</option>
              </select>
            </div>
          </div>

          {formData.valueType !== "auto" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Value * {formData.valueType === "percentage" ? "(%)" : "(ZMW)"}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.valueType === "percentage" ? "0-100" : "Amount"
                }
                step={formData.valueType === "percentage" ? "0.1" : "1"}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {formData.valueType === "auto" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Formula/Description
              </label>
              <input
                type="text"
                value={formData.value as string}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder="e.g., 5% of Basic, Tax Slab"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Statutory (Optional)
            </label>
            <select
              value={formData.statutory || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  statutory: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">None</option>
              <option value="NAPSA Base">NAPSA Base</option>
              <option value="NAPSA">NAPSA</option>
              <option value="NHIMA">NHIMA</option>
              <option value="PAYE">PAYE</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="taxable"
              checked={formData.taxable}
              onChange={(e) =>
                setFormData({ ...formData, taxable: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="taxable" className="text-sm text-gray-700">
              Taxable
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Component
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  structure,
  onConfirm,
  onCancel,
}: {
  structure: SalaryStructure;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30
"
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">
              Delete Salary Structure?
            </h4>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <strong>"{structure.name}"</strong>?
            </p>
          </div>
        </div>

        {structure.usedBy > 0 ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-700">
              ⚠️ Cannot delete! This structure is used by{" "}
              <strong>{structure.usedBy} employees</strong>. Please reassign
              them first.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              This action cannot be undone. The structure will be permanently
              deleted.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={structure.usedBy > 0}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Structure
          </button>
        </div>
      </div>
    </div>
  );
}
