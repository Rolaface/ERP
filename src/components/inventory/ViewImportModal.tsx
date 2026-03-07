import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getImportItemById, updateStockAutomatic } from "../../api/importApi";
import { getCountryList } from "../../api/lookupApi";
import { API } from "../../config/api";
import Modal from "../ui/modal/modal";
import { Button } from "../ui/modal/formComponent";

interface ViewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importId: string | null;
  onSuccess?: () => void;
}

interface ImportItemDetails {
  taskCode: string;
  declarationDate: string;
  itemSequence: string;
  declarationNumber: string;
  hsCode: string;
  itemName: string;
  importItemStatus: string;
  originCountryCode: string;
  exportCountryCode: string;
  packageQuantity: string;
  packageUnitCode: string | null;
  quantity: string;
  quantityUnitCode: string;
  totalWeight: string;
  netWeight: string;
  supplierName: string;
  agentName: string;
  invoiceAmount: string;
  invoiceCurrency: string;
  invoiceExchangeRate: string;
  id: string;
  syncStatus: string;
  itemClassCode?: string;
}

const ViewImportModal: React.FC<ViewImportModalProps> = ({
  isOpen,
  onClose,
  importId,
  onSuccess,
}) => {
  const [importData, setImportData] = useState<ImportItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("Approved");
  const [itemClassOptions, setItemClassOptions] = useState<
    Array<{ cd: string; cdNm: string; lvl: string }>
  >([]);
  const [loadingItemClasses, setLoadingItemClasses] = useState(false);
  const [countryNameByCode, setCountryNameByCode] = useState<
    Record<string, string>
  >({});

  // Cascading dropdown states
  const [selectedLevel1, setSelectedLevel1] = useState("");
  const [selectedLevel2, setSelectedLevel2] = useState("");
  const [selectedLevel3, setSelectedLevel3] = useState("");
  const [selectedLevel4, setSelectedLevel4] = useState("");

  const fetchImportDetails = useCallback(async () => {
    if (!importId) return;

    try {
      setLoading(true);
      const data = await getImportItemById(importId);
      setImportData(data);
    } catch (err) {
      toast.error("Failed to load import item details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [importId]);

  const fetchItemClassList = useCallback(async () => {
    try {
      setLoadingItemClasses(true);
      const response = await fetch(API.lookup.getItemClasses);
      const data = await response.json();
      const mapped = data.map((item: any) => ({
        cd: item.itemClsCd || item.cd || "",
        cdNm: item.itemClsNm || item.cdNm || "",
        lvl: item.itemClsLvl || item.lvl || "1",
      }));
      setItemClassOptions(mapped || []);
    } catch (err) {
      toast.error("Failed to load item class list");
      console.error(err);
      setItemClassOptions([]);
    } finally {
      setLoadingItemClasses(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && importId) {
      void fetchImportDetails();
    }
  }, [isOpen, importId, fetchImportDetails]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const list = await getCountryList();
        const map: Record<string, string> = {};
        (list ?? []).forEach((c: any) => {
          const code = String(c?.code ?? "").trim();
          const name = String(c?.name ?? "").trim();
          if (code) map[code] = name;
        });
        setCountryNameByCode(map);
      } catch {
        setCountryNameByCode({});
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (showApprovalForm) {
      void fetchItemClassList();
    }
  }, [showApprovalForm, fetchItemClassList]);

  // Helper function to get codes by level and parent
  const getCodesByLevel = (level: string, parentCode?: string) => {
    return itemClassOptions.filter((option) => {
      if (option.lvl !== level) return false;

      // Level 1 has no parent
      if (level === "1") return true;

      // For other levels, check if code starts with parent prefix
      if (!parentCode) return false;

      const prefixLength = parseInt(level) * 2;
      const parentPrefix = parentCode.substring(0, prefixLength - 2);
      const codePrefix = option.cd.substring(0, prefixLength - 2);

      return codePrefix === parentPrefix;
    });
  };

  // Handle level selection - clear child levels when parent changes
  const handleLevelChange = (level: number, value: string) => {
    switch (level) {
      case 1:
        setSelectedLevel1(value);
        setSelectedLevel2("");
        setSelectedLevel3("");
        setSelectedLevel4("");
        break;
      case 2:
        setSelectedLevel2(value);
        setSelectedLevel3("");
        setSelectedLevel4("");
        break;
      case 3:
        setSelectedLevel3(value);
        setSelectedLevel4("");
        break;
      case 4:
        setSelectedLevel4(value);
        break;
    }
  };

  const handleClose = () => {
    setImportData(null);
    setShowApprovalForm(false);
    setApprovalStatus("Approved");
    setItemClassOptions([]);
    setSelectedLevel1("");
    setSelectedLevel2("");
    setSelectedLevel3("");
    setSelectedLevel4("");
    onClose();
  };

  const handleApproveClick = () => {
    setShowApprovalForm(true);
  };

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!importId) {
      toast.error("Import ID is missing");
      return;
    }

    // Calculate final item class code - use the deepest selected level
    const finalItemClassCd =
      selectedLevel4 || selectedLevel3 || selectedLevel2 || selectedLevel1;

    if (!finalItemClassCd) {
      toast.error("Please select an Item Class Code");
      return;
    }

    // Validate that level 3 or 4 is selected (reject levels 1 and 2)
    if (!selectedLevel3 && !selectedLevel4) {
      if (selectedLevel1 && !selectedLevel2) {
        toast.error(
          "Item Class Level 1 alone is not sufficient. Please select at least Level 3 or higher.",
        );
      } else if (selectedLevel2 && !selectedLevel3) {
        toast.error(
          "Item Class Level 2 is not sufficient. Please select at least Level 3 or higher.",
        );
      } else {
        toast.error("Please select at least Item Class Level 3 to proceed.");
      }
      return;
    }

    try {
      setApprovalLoading(true);
      const payload = {
        id: importId,
        status: approvalStatus,
        itemClassCd: finalItemClassCd,
      };

      await updateStockAutomatic(payload);
      toast.success(`Import item ${approvalStatus.toLowerCase()} successfully`);

      // Refresh the data
      await fetchImportDetails();
      setShowApprovalForm(false);
      setApprovalStatus("Approved");
      setSelectedLevel1("");
      setSelectedLevel2("");
      setSelectedLevel3("");
      setSelectedLevel4("");

      // Call onSuccess to refresh the import list
      onSuccess?.();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${approvalStatus.toLowerCase()} import item`,
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Item Details"
      subtitle={`Viewing details for import ID: ${importId}`}
      maxWidth="5xl"
      height="auto"
    >
      <div className="flex flex-col max-h-[85vh]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading import details...</div>
          </div>
        ) : importData ? (
          <>
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1">
              {/* Item Information */}
              <section className="p-6 space-y-6">
                {!showApprovalForm ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField label="Import ID" value={importData.id} />
                        <InfoField
                          label="Task Code"
                          value={importData.taskCode}
                        />
                        <InfoField
                          label="Item Sequence"
                          value={importData.itemSequence}
                        />
                        <InfoField
                          label="Declaration Number"
                          value={importData.declarationNumber}
                        />
                        <InfoField
                          label="Declaration Date"
                          value={importData.declarationDate}
                        />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                            Sync Status
                          </label>
                          <div
                            className={`inline-block text-sm px-3 py-2 rounded border font-medium ${
                              importData.syncStatus === "1"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {importData.syncStatus === "1"
                              ? "Approved"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2 ">
                        Item Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField
                          label="Item Name"
                          value={importData.itemName}
                        />
                        <InfoField label="HS Code" value={importData.hsCode} />
                        <InfoField
                          label="Import Status"
                          value={importData.importItemStatus}
                        />
                        {importData.itemClassCode && (
                          <InfoField
                            label="Item Class Code"
                            value={importData.itemClassCode}
                          />
                        )}
                      </div>
                    </div>

                    {/* Quantity Information */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2 ">
                        Quantity & Weight
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField
                          label="Quantity"
                          value={importData.quantity}
                        />
                        <InfoField
                          label="Quantity Unit"
                          value={importData.quantityUnitCode}
                        />
                        <InfoField
                          label="Package Quantity"
                          value={importData.packageQuantity}
                        />
                        <InfoField
                          label="Package Unit"
                          value={importData.packageUnitCode || "N/A"}
                        />
                        <InfoField
                          label="Total Weight"
                          value={importData.totalWeight}
                        />
                        <InfoField
                          label="Net Weight"
                          value={importData.netWeight}
                        />
                      </div>
                    </div>

                    {/* Origin & Export Information */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2 ">
                        Origin & Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField
                          label="Origin Country Code"
                          value={
                            countryNameByCode[
                              String(importData.originCountryCode ?? "")
                            ] || importData.originCountryCode
                          }
                        />
                        <InfoField
                          label="Export Country Code"
                          value={
                            countryNameByCode[
                              String(importData.exportCountryCode ?? "")
                            ] || importData.exportCountryCode
                          }
                        />
                      </div>
                    </div>

                    {/* Invoice Information */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2 ">
                        Invoice & Financial
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField
                          label="Invoice Amount"
                          value={importData.invoiceAmount}
                        />
                        <InfoField
                          label="Invoice Currency"
                          value={importData.invoiceCurrency}
                        />
                        <InfoField
                          label="Exchange Rate"
                          value={importData.invoiceExchangeRate}
                        />
                      </div>
                    </div>

                    {/* Parties Information */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 pb-2 ">
                        Parties
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoField
                          label="Supplier Name"
                          value={importData.supplierName}
                        />
                        <InfoField
                          label="Agent Name"
                          value={importData.agentName}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      void handleApprovalSubmit(e);
                    }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      Approve/Reject Import Item
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="px-3 py-2 rounded border border-theme bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={approvalStatus}
                          onChange={(e) => setApprovalStatus(e.target.value)}
                          required
                        >
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Cascading Item Class Code Dropdowns */}
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                          Item Class Level 1
                        </label>
                        <select
                          className="px-3 py-2 rounded border border-theme bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={selectedLevel1}
                          onChange={(e) => handleLevelChange(1, e.target.value)}
                          disabled={loadingItemClasses}
                        >
                          <option value="">
                            {loadingItemClasses
                              ? "Loading..."
                              : "Select Level 1"}
                          </option>
                          {getCodesByLevel("1").map((option) => (
                            <option key={option.cd} value={option.cd}>
                              {option.cd} - {option.cdNm}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedLevel1 &&
                        getCodesByLevel("2", selectedLevel1).length > 0 && (
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">
                              Item Class Level 2
                            </label>
                            <select
                              className="px-3 py-2 rounded border border-theme bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={selectedLevel2}
                              onChange={(e) =>
                                handleLevelChange(2, e.target.value)
                              }
                            >
                              <option value="">Select Level 2</option>
                              {getCodesByLevel("2", selectedLevel1).map(
                                (option) => (
                                  <option key={option.cd} value={option.cd}>
                                    {option.cd} - {option.cdNm}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        )}

                      {selectedLevel2 &&
                        getCodesByLevel("3", selectedLevel2).length > 0 && (
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">
                              Item Class Level 3{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="px-3 py-2 rounded border border-theme bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={selectedLevel3}
                              onChange={(e) =>
                                handleLevelChange(3, e.target.value)
                              }
                            >
                              <option value="">
                                Select Level 3 (Required)
                              </option>
                              {getCodesByLevel("3", selectedLevel2).map(
                                (option) => (
                                  <option key={option.cd} value={option.cd}>
                                    {option.cd} - {option.cdNm}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        )}

                      {selectedLevel3 &&
                        getCodesByLevel("4", selectedLevel3).length > 0 && (
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">
                              Item Class Level 4
                            </label>
                            <select
                              className="px-3 py-2 rounded border border-theme bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={selectedLevel4}
                              onChange={(e) =>
                                handleLevelChange(4, e.target.value)
                              }
                            >
                              <option value="">
                                Select Level 4 (Optional)
                              </option>
                              {getCodesByLevel("4", selectedLevel3).map(
                                (option) => (
                                  <option key={option.cd} value={option.cd}>
                                    {option.cd} - {option.cdNm}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setShowApprovalForm(false);
                          setApprovalStatus("Approved");
                          setSelectedLevel1("");
                          setSelectedLevel2("");
                          setSelectedLevel3("");
                          setSelectedLevel4("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        loading={approvalLoading}
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4">
              <div>
                {importData.syncStatus === "0" && !showApprovalForm && (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleApproveClick}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">No import data available</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Helper component for displaying info fields
const InfoField: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div>
    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
      {label}
    </label>
    <p className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
      {value}
    </p>
  </div>
);

export default ViewImportModal;
