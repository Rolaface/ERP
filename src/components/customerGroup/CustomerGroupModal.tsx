import React from "react";
import { FolderTree, Trash2 } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import { useCustomerGroupModal } from "../../hooks/useCustomerGroupModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { CustomerGroupPayload } from "../../api/customerGroupApi";
import ItemRestrictionSelect from "../selects/customer group/ItemRescritionSelect";
import { showValidationError } from "../../utils/alert";

interface Props {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  initialData?: any;
  onClose: () => void;
  onSubmit: (payload: CustomerGroupPayload) => void;
}

const TOGGLE_W = 156;
const TOGGLE_H = 28;
const PILL_PAD = 3;

const CustomerGroupModal: React.FC<Props> = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}) => {
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    restrictionMode,
    restrictedItems,
    handleFormChange,
    toggleRestrictionMode,
    addRestrictedItem,
    removeRestrictedItem,
    resetModal,
    buildPayload,
    page,
    paginatedItems,
    totalPages,
    hasPagination,
    goToPrevPage,
    goToNextPage,
    ITEMS_PER_PAGE,
  } = useCustomerGroupModal(initialData);

  const isView = mode === "view";
  const title =
    mode === "create"
      ? "Add Customer Group"
      : mode === "edit"
        ? "Edit Customer Group"
        : "View Customer Group";

  const handleClose = () => {
    resetDirty();
    resetModal();
    onClose();
  };

  const handleCloseRequest = () => {
    if (isView) {
      handleClose();
      return;
    }

    handleCloseWithConfirm(handleClose);
  };

  const handleSave = () => {
    if (isView) return;

    if (!form.customerGroupName.trim()) {
      return showValidationError("Customer Group Name is required");
    }

    onSubmit(buildPayload());
    resetDirty();
    resetModal();
  };

  const footer = (
    <div className="flex justify-between w-full">
      <Button variant="secondary" onClick={handleCloseRequest}>
        {isView ? "Close" : "Cancel"}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSave}>
Submit        </Button>
      )}
    </div>
  );

  const selectedIds = restrictedItems.map((x) => x.id);
  const isAllowed = restrictionMode === "Allow";
  const pillW = TOGGLE_W / 2 - PILL_PAD;
  const pillSlide = TOGGLE_W / 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseRequest}
      title={title}
      subtitle="Manage customer group details"
      footer={footer}
      icon={FolderTree}
      customWidth="50vw"
      height="82vh"
    >
      <div className="p-6 space-y-8 bg-app" onChange={() => !isView && markDirty()}>
        {/* ── Top form row ── */}
        <div className="grid grid-cols-2 gap-6">
          <ModalInput
            label="Customer Group Name *"
            name="customerGroupName"
            value={form.customerGroupName}
            onChange={handleFormChange}
            placeholder="e.g. Retail Customers"
            disabled={isView}
          />
          <ModalInput
            label="Parent Customer Group"
            name="parentCustomerGroup"
            value={form.parentCustomerGroup}
            onChange={handleFormChange}
            placeholder="e.g. All Customer Groups"
            disabled={isView}
          />
          <ModalInput
            label="Default Price List"
            name="defaultPriceList"
            value={form.defaultPriceList}
            onChange={handleFormChange}
            placeholder="e.g. Standard Selling"
            disabled={isView}
          />
          <ModalInput
            label="Default Payment Terms Template"
            name="paymentTerms"
            value={form.paymentTerms}
            onChange={handleFormChange}
            placeholder="e.g. Net 30"
            disabled={isView}
          />
        </div>

        {/* Is Group Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isGroup"
            name="isGroup"
            checked={form.isGroup}
            onChange={handleFormChange}
            disabled={isView}
            className="rounded border-theme"
          />
          <label
            htmlFor="isGroup"
            className={`text-sm ${isView ? "text-muted" : "text-main"}`}
          >
            Is Group (Can have child groups)
          </label>
        </div>

        {/* ── Item Restriction Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-main">
              Item Restrictions
            </h3>

            {/* ── Pill toggle ── */}
            <button
              type="button"
              onClick={
                isView
                  ? undefined
                  : () => {
                      markDirty();
                      toggleRestrictionMode();
                    }
              }
              disabled={isView}
              aria-label="Toggle restriction mode"
              style={{
                width: TOGGLE_W,
                height: TOGGLE_H,
                padding: PILL_PAD,
                borderRadius: TOGGLE_H / 2,
                backgroundColor: isAllowed ? "#bbf7d0" : "#fecaca",
                position: "relative",
                display: "flex",
                alignItems: "center",
                border: "none",
                cursor: isView ? "default" : "pointer",
                opacity: isView ? 0.7 : 1,
                transition: "background-color 0.25s ease",
                outline: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: PILL_PAD,
                  left: PILL_PAD,
                  width: pillW,
                  height: TOGGLE_H - PILL_PAD * 2,
                  borderRadius: (TOGGLE_H - PILL_PAD * 2) / 2,
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  transform: isAllowed
                    ? "translateX(0)"
                    : `translateX(${pillSlide}px)`,
                  transition: "transform 0.25s ease",
                  zIndex: 1,
                }}
              />
              <span
                style={{
                  position: "relative",
                  zIndex: 2,
                  flex: 1,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isAllowed ? "#15803d" : "rgba(0,0,0,0.6)",
                  transition: "color 0.25s ease",
                  userSelect: "none",
                }}
              >
                Allow
              </span>
              <span
                style={{
                  position: "relative",
                  zIndex: 2,
                  flex: 1,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: !isAllowed ? "#b91c1c" : "rgba(0,0,0,0.6)",
                  transition: "color 0.25s ease",
                  userSelect: "none",
                }}
              >
                Deny
              </span>
            </button>
          </div>

          <p className="text-xs text-muted">
            {isAllowed
              ? "Only the items listed below are allowed for this customer group."
              : "The items listed below are denied for this customer group."}
          </p>

          {!isView && (
            <ItemRestrictionSelect
              selectedIds={selectedIds}
              onSelect={(item) => {
                markDirty();
                addRestrictedItem(item);
              }}
            />
          )}

          {restrictedItems.length > 0 ? (
            <>
              <div className="border border-theme rounded overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-row-hover border-b border-theme">
                      <th className="text-left px-4 py-2 text-muted font-semibold w-[30px]">
                        #
                      </th>
                      <th className="text-left px-4 py-2 text-muted font-semibold w-[200px]">
                        Item ID
                      </th>
                      <th className="text-left px-4 py-2 text-muted font-semibold">
                        Item Name
                      </th>
                      {!isView && <th className="w-10" />}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => {
                      const globalIdx = page * ITEMS_PER_PAGE + idx;
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-theme last:border-0 ${
                            globalIdx % 2 === 0 ? "bg-card" : "bg-app"
                          }`}
                        >
                          <td className="px-4 py-2 text-muted text-[11px]">
                            {globalIdx + 1}
                          </td>
                          <td className="px-4 py-2 text-muted font-mono">
                            {item.id}
                          </td>
                          <td className="px-4 py-2 text-main font-medium">
                            {item.itemName}
                          </td>
                          {!isView && (
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  markDirty();
                                  removeRestrictedItem(item.id);
                                }}
                                className="text-red-400 hover:text-red-400 transition-colors"
                                aria-label={`Remove ${item.itemName}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasPagination && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                    <div className="text-[11px] text-muted whitespace-nowrap">
                      Showing {page * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min(
                        (page + 1) * ITEMS_PER_PAGE,
                        restrictedItems.length,
                      )}{" "}
                      of {restrictedItems.length} items
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={goToPrevPage}
                        disabled={page === 0}
                        className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={page >= totalPages - 1}
                        className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-theme rounded py-8 text-center text-muted text-xs">
              {isView
                ? "No items restricted."
                : "No items added yet. Search above to add items to the restriction list."}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerGroupModal;
