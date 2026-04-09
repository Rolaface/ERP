import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolCase } from "lucide-react";
import { getAllTemplates } from "../../api/TaxTemplateApi";
import { useItemForm } from "../../hooks/Useitemform";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { Button } from "../ui/modal/formComponent";
import { MinimizableModal } from "../common/MinimizableModal";
import AdditionalDetailsSection from "./AdditionalDetailsSection";
import BasicDetailsSection from "./BasicDetailsSection";
import InventorySection from "./InventorySection";
import PricingSection from "./PricingSection";
import TaxSection from "./TaxSection";
import type { ItemFormData, ItemModalTab, ItemTaxRow } from "./itemModalTypes";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (response: unknown) => void;
  initialData?: Partial<ItemFormData> | null;
  isEditMode?: boolean;
  modalId?: string;
}

interface TaxTemplateOption {
  label: string;
  value: string;
}

/** Shape of a single tax line from the API */
interface TemplateTax {
  tax_type: string;
  tax_rate: number;
}

interface TaxTemplateResponse {
  data?: {
    templates?: Array<{
      name: string;
      title: string;
      taxes?: TemplateTax[];
    }>;
  };
}

const TAX_ITEMS_PER_PAGE = 5;
const ITEM_FORM_ID = "item-modal-form";

const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId = useMemo(
    () =>
      modalId ||
      (isEditMode && initialData?.id
        ? `item-edit-${initialData.id}`
        : "item-create"),
    [initialData?.id, isEditMode, modalId],
  );

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    setForm,
    loading,
    activeTab,
    setActiveTab,
    isServiceItem,
    handleForm,
    reset,
    handleClose,
    handleSubmit,
    itemGroups,
    loadingItemGroups,
    suppliers,
    loadingSuppliers,
  } = useItemForm({ isOpen, isEditMode, initialData, onSubmit, onClose });

  const [taxRows, setTaxRows] = useState<ItemTaxRow[]>([
    { taxCategory: "", taxTemplate: "" },
  ]);
  const [taxPage, setTaxPage] = useState(0);

  /**
   * Cache: template value (name) → taxes array.
   * Populated whenever fetchTaxTemplateOptions is called and results are returned.
   * Using useRef so updates don't trigger re-renders.
   */
  const templateTaxCacheRef = useRef<Map<string, TemplateTax[]>>(new Map());

  useEffect(() => {
    if (!isOpen) return;

    const initialTaxRows =
      isEditMode &&
      Array.isArray(initialData?.taxes) &&
      initialData.taxes.length > 0
        ? initialData.taxes
        : [{ taxCategory: "", taxTemplate: "" }];

    setTaxRows(initialTaxRows);
    setTaxPage(0);
  }, [initialData?.taxes, isEditMode, isOpen]);

  /**
   * Fetches tax template options for SearchSelect2.
   * Also populates templateTaxCacheRef so hovering a selected template
   * can show its tax breakdown via tooltip.
   */
  const fetchTaxTemplateOptions = useCallback(
    async (search: string): Promise<TaxTemplateOption[]> => {
      try {
        const response = (await getAllTemplates(
          1,
          20,
          search || undefined,
        )) as TaxTemplateResponse;
        const templates = response.data?.templates ?? [];

        // Populate cache with tax details for each returned template
        templates.forEach((template) => {
          if (template.taxes) {
            templateTaxCacheRef.current.set(template.name, template.taxes);
          }
        });

        return templates.map((template) => ({
          label: template.title,
          value: template.name,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  /**
   * Look up cached taxes for a given template value (name).
   * Returns undefined if the template has not been fetched yet.
   */
  const getTemplateTaxes = useCallback(
    (templateValue: string): TemplateTax[] | undefined =>
      templateTaxCacheRef.current.get(templateValue),
    [],
  );

  const setField = useCallback(
    <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
      setForm((previous) => ({ ...previous, [field]: value }));
    },
    [setForm],
  );

  const handleToggleChange = useCallback(
    (name: string, value: string) => {
      setForm((previous) => ({ ...previous, [name]: value }));
    },
    [setForm],
  );

  const handleTabChange = useCallback(
    (tab: ItemModalTab) => {
      if (tab === "inventoryDetails" && isServiceItem) return;
      setActiveTab(tab);
    },
    [isServiceItem, setActiveTab],
  );

  const handleTaxRowChange = useCallback(
    (absoluteIndex: number, field: keyof ItemTaxRow, value: string) => {
      setTaxRows((previous) =>
        previous.map((row, index) =>
          index === absoluteIndex ? { ...row, [field]: value } : row,
        ),
      );

      if (absoluteIndex === 0 && field === "taxCategory") {
        setForm((previous) => ({ ...previous, taxCategory: value }));
      }
    },
    [setForm],
  );

  const addTaxRow = useCallback(() => {
    setTaxRows((previous) => {
      const nextRows = [...previous, { taxCategory: "", taxTemplate: "" }];
      setTaxPage(Math.floor((nextRows.length - 1) / TAX_ITEMS_PER_PAGE));
      return nextRows;
    });
  }, []);

  const removeTaxRow = useCallback((absoluteIndex: number) => {
    setTaxRows((previous) => {
      if (previous.length === 1) return previous;

      const nextRows = previous.filter((_, index) => index !== absoluteIndex);
      const maxPage = Math.max(
        0,
        Math.ceil(nextRows.length / TAX_ITEMS_PER_PAGE) - 1,
      );
      setTaxPage((current) => Math.min(current, maxPage));

      return nextRows;
    });
  }, []);

  const paginatedTaxRows = useMemo(
    () =>
      taxRows.slice(
        taxPage * TAX_ITEMS_PER_PAGE,
        (taxPage + 1) * TAX_ITEMS_PER_PAGE,
      ),
    [taxPage, taxRows],
  );

  const handlePreviousTaxPage = useCallback(() => {
    setTaxPage((page) => Math.max(0, page - 1));
  }, []);

  const handleNextTaxPage = useCallback(() => {
    setTaxPage((page) =>
      (page + 1) * TAX_ITEMS_PER_PAGE >= taxRows.length ? page : page + 1,
    );
  }, [taxRows.length]);

  const handleCloseRequest = useCallback(() => {
    void handleCloseWithConfirm(handleClose, resolvedModalId);
  }, [handleClose, handleCloseWithConfirm, resolvedModalId]);

  const handleReset = useCallback(() => {
    resetDirty();
    reset();
    setTaxRows([{ taxCategory: "", taxTemplate: "" }]);
    setTaxPage(0);
  }, [reset, resetDirty]);

  const submitLabel =
    activeTab === "inventoryDetails" ||
    (activeTab === "taxDetails" && isServiceItem)
      ? "Submit"
      : "Next";

  if (!isOpen) return null;

  const footer = (
    <div className="flex w-full justify-end gap-2">
      <Button variant="secondary" type="button" onClick={handleCloseRequest}>
        Cancel
      </Button>
      <Button variant="danger" type="button" onClick={handleReset}>
        Reset
      </Button>
      <Button
        form={ITEM_FORM_ID}
        variant="primary"
        type="submit"
        loading={loading}
      >
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseRequest}
      title={isEditMode ? "Edit Item" : "Add Item"}
      subtitle="Create and manage item details"
      icon={ToolCase}
      footer={footer}
      customWidth="min(92vw, 1280px)"
      height="64vh"
    >
      <form
        id={ITEM_FORM_ID}
        onChange={markDirty}
        onSubmit={(event) => {
          resetDirty();
          setForm((previous) => ({ ...previous, taxes: taxRows }));
          void handleSubmit(event);
        }}
        noValidate
        className="min-h-full"
      >
        {/* Tab navigation */}
        <div className="-mx-4 -mt-3 border-b border-theme bg-app px-6">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => handleTabChange("details")}
              className={[
                "border-b-2 bg-transparent px-1 py-2.5 text-sm font-semibold tracking-wide transition-all",
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main",
              ].join(" ")}
            >
              Item Details
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("taxDetails")}
              className={[
                "border-b-2 bg-transparent px-1 py-2.5 text-sm font-semibold tracking-wide transition-all",
                activeTab === "taxDetails"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main",
              ].join(" ")}
            >
              Tax Details
            </button>
            <button
              type="button"
              disabled={isServiceItem}
              onClick={() => handleTabChange("inventoryDetails")}
              className={[
                "border-b-2 bg-transparent px-1 py-2.5 text-sm font-semibold tracking-wide transition-all",
                activeTab === "inventoryDetails"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main",
                isServiceItem ? "cursor-not-allowed opacity-40" : "",
              ].join(" ")}
            >
              Inventory Details
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="px-2 py-5">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Row 1: Item Type, Item Category, Item Name, Description, HSN Code */}
              <BasicDetailsSection
                form={form}
                itemGroups={itemGroups}
                loadingItemGroups={loadingItemGroups}
                onFormChange={handleForm}
                setField={setField}
              />

              {/* Row 2: Packing Unit, UOM, SKU, Country, SVC Charge, Insurance, Taxable */}
              <AdditionalDetailsSection
                form={form}
                onFormChange={handleForm}
                onToggleChange={handleToggleChange}
                setField={setField}
              />

              {/* Row 3: Sales & Purchase */}
              <PricingSection
                form={form}
                suppliers={suppliers}
                loadingSuppliers={loadingSuppliers}
                onFormChange={handleForm}
              />
            </div>
          )}

          {activeTab === "taxDetails" && (
            <TaxSection
              taxRows={taxRows}
              paginatedRows={paginatedTaxRows}
              taxPage={taxPage}
              itemsPerPage={TAX_ITEMS_PER_PAGE}
              fetchTaxTemplateOptions={fetchTaxTemplateOptions}
              getTemplateTaxes={getTemplateTaxes}
              onTaxRowChange={handleTaxRowChange}
              onAddTaxRow={addTaxRow}
              onRemoveTaxRow={removeTaxRow}
              onPreviousPage={handlePreviousTaxPage}
              onNextPage={handleNextTaxPage}
            />
          )}

          {activeTab === "inventoryDetails" && (
            <InventorySection
              form={form}
              isServiceItem={isServiceItem}
              onFormChange={handleForm}
              setField={setField}
            />
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ItemModal;