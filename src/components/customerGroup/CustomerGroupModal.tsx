import React from "react";
import { Trash2 } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import { useCustomerGroupModal } from "../../hooks/useCustomerGroupModal";
import type { CustomerGroupPayload } from "../../hooks/useCustomerGroupModal";
import ItemRestrictionSelect from "../selects/customer group/ItemRescritionSelect";

// ─── Props 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CustomerGroupPayload) => void;
}

// ─── Component 

const CustomerGroupModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const {
    form,
    restrictionMode,
    restrictedItems,
    isValid,
    handleFormChange,
    toggleRestrictionMode,
    addRestrictedItem,
    removeRestrictedItem,
    resetModal,
    buildPayload,

    // pagination
    page,
    paginatedItems,
    totalPages,
    hasPagination,
    goToPrevPage,
    goToNextPage,
    ITEMS_PER_PAGE,
  } = useCustomerGroupModal();

  // ── Handlers 

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSave = () => {
    if (!isValid) return;
    onSubmit(buildPayload());
    resetModal();
    onClose();
  };

  // ── Footer 

  const footer = (
    <div className="flex justify-between w-full">
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={!isValid}>
        Save
      </Button>
    </div>
  );

  const selectedIds = restrictedItems.map((x) => x.id);

  // ── Render 

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Customer Group"
      subtitle="Manage customer groups"
      footer={footer}
      customWidth="50vw"
      height="82vh"
    >
      <div className="p-6 space-y-8 bg-app">

        {/* ── Top form row ── */}
        <div className="grid grid-cols-3 gap-6">
          <ModalInput
            label="Customer Group Name"
            name="customerGroupName"
            value={form.customerGroupName}
            onChange={handleFormChange}
            placeholder="e.g. Retail Customers"
          />
          <ModalInput
            label="Default Price List"
            name="defaultPriceList"
            value={form.defaultPriceList}
            onChange={handleFormChange}
            placeholder="e.g. Standard Selling"
          />
          <ModalInput
            label="Default Payment Terms Template"
            name="defaultPaymentTerms"
            value={form.defaultPaymentTerms}
            onChange={handleFormChange}
            placeholder="e.g. Net 30"
          />
        </div>

        {/* ── Item Restriction Section ── */}
        <div className="space-y-3">

          {/* Section header + toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-main">Item Restrictions</h3>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">Mode:</span>
              <button
                type="button"
                onClick={toggleRestrictionMode}
                className={`
                  relative inline-flex h-6 w-28 items-center rounded-full
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                  ${restrictionMode === "allowed" ? "bg-green-500" : "bg-red-500"}
                `}
                aria-label="Toggle restriction mode"
              >
                <span
                  className={`
                    inline-block h-5 w-5 transform rounded-full bg-white shadow
                    transition-transform duration-200
                    ${restrictionMode === "allowed"
                      ? "translate-x-1"
                      : "translate-x-[calc(7rem-1.5rem)]"}
                  `}
                />
                <span
                  className={`
                    absolute w-full text-center text-[11px] font-semibold text-white select-none
                    ${restrictionMode === "allowed" ? "pl-4" : "pr-2"}
                  `}
                >
                  {restrictionMode === "allowed" ? "Allowed" : "Disallowed"}
                </span>
              </button>
            </div>
          </div>

          {/* Mode hint */}
          <p className="text-xs text-muted">
            {restrictionMode === "allowed"
              ? "Only the items listed below will be available for this customer group."
              : "The items listed below will NOT be available for this customer group."}
          </p>

          {/* Search / add input */}
          <ItemRestrictionSelect
            selectedIds={selectedIds}
            onSelect={addRestrictedItem}
          />

          {/* Restriction table */}
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
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => {
                      const globalIdx = page * ITEMS_PER_PAGE + idx;

                      return (
                        <tr
                          key={item.id}
                          className={`
                            border-b border-theme last:border-0
                            ${globalIdx % 2 === 0 ? "bg-card" : "bg-app"}
                          `}
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
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeRestrictedItem(item.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              aria-label={`Remove ${item.itemName}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {hasPagination && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                    <div className="text-[11px] text-muted whitespace-nowrap">
                      Showing {page * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min((page + 1) * ITEMS_PER_PAGE, restrictedItems.length)}{" "}
                      of {restrictedItems.length} items
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={goToPrevPage}
                        disabled={page === 0}
                        className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]
                          disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={page >= totalPages - 1}
                        className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]
                          disabled:opacity-40 disabled:cursor-not-allowed"
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
              No items added yet. Search above to add items to the restriction list.
            </div>
          )}

        </div>
      </div>
    </Modal>
  );
};

export default CustomerGroupModal;