import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Package } from "lucide-react";
import { getAllTemplates, getEnabledTemplates } from "../../api/TaxTemplateApi";
import { useItemForm } from "../../hooks/Useitemform";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { StandardModalProps } from "../../types/modal";
import ModalFooter from "../common/ModalFooter";
import { MinimizableModal } from "../common/MinimizableModal";
import AdditionalDetailsSection from "./AdditionalDetailsSection";
import BasicDetailsSection from "./BasicDetailsSection";
import InventorySection from "./InventorySection";
import PricingSection from "./PricingSection";
import TaxSection from "./TaxSection";
import ItemSummaryBar from "./Itemsummarybar";
import type {
  ItemFormData,
  ItemModalTab,
  ItemTaxInfo,
  ItemTaxRow,
} from "./itemModalTypes";

export interface ItemInitialData extends Partial<ItemFormData> {
  taxes?: ItemTaxRow[];
  taxInfo?: Partial<ItemTaxInfo> | Array<Partial<ItemTaxInfo>>;
}

interface ItemModalProps extends StandardModalProps<unknown, ItemInitialData> { }

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
const ITEM_FORM_ID_PREFIX = "item-modal-form";
const EMPTY_TAX_ROW: ItemTaxRow = { taxCategory: "", taxTemplate: "" };

const mapTaxInfoToRows = (
  taxInfo?: Partial<ItemTaxInfo> | Array<Partial<ItemTaxInfo>>,
): ItemTaxRow[] => {
  const taxInfoRows = Array.isArray(taxInfo)
    ? taxInfo
    : taxInfo
      ? [taxInfo]
      : [];

  return taxInfoRows
    .map((row) => ({
      taxCategory: row.taxCategory ?? "",
      taxTemplate: row.taxName ?? "",
    }))
    .filter((row) => row.taxCategory || row.taxTemplate);
};

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
  const itemFormId = useMemo(
    () => `${ITEM_FORM_ID_PREFIX}-${resolvedModalId}`,
    [resolvedModalId],
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
    handleClose,
    handleSubmit,
    handleSave,
    handleNext,
    getFirstValidationError,
    getValidationErrorForTab,
    itemGroups,
    loadingItemGroups,
   
  } = useItemForm({ isOpen, isEditMode, initialData, onSubmit, onClose });

  const [taxRows, setTaxRows] = useState<ItemTaxRow[]>([EMPTY_TAX_ROW]);
  const [taxPage, setTaxPage] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const templateTaxCacheRef = useRef<Map<string, TemplateTax[]>>(new Map());

  useEffect(() => {
    if (!isOpen) return;

    const taxInfoRows = mapTaxInfoToRows(initialData?.taxInfo);
    const initialTaxRows =
      isEditMode && taxInfoRows.length > 0
        ? taxInfoRows
        : isEditMode && initialData?.taxes && initialData.taxes.length > 0
          ? initialData.taxes
          : [EMPTY_TAX_ROW];

    setTaxRows(initialTaxRows);
    setTaxPage(0);
  }, [initialData?.taxInfo, initialData?.taxes, isEditMode, isOpen]);

  useEffect(() => {
    if (!form.trackInventory && activeTab === "inventoryDetails") {
      setActiveTab("taxDetails");
    }
  }, [form.trackInventory, activeTab, setActiveTab]);


  const fetchTaxTemplateOptions = useCallback(
    async (search: string): Promise<TaxTemplateOption[]> => {
      try {
        const response = (await getEnabledTemplates(
          1,
          20,
          search || undefined,
        )) as TaxTemplateResponse;
        const templates = response.data?.templates ?? [];


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

  const getTemplateTaxes = useCallback(
    (templateValue: string): TemplateTax[] | undefined =>
      templateTaxCacheRef.current.get(templateValue),
    [],
  );

  const setField = useCallback(
    <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
      setForm((previous) => ({ ...previous, [field]: value }));
      setFieldErrors((previous) => {
        if (!previous[field as string]) return previous;
        const next = { ...previous };
        delete next[field as string];
        return next;
      });
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
      if (tab === "inventoryDetails" && (!form.trackInventory || isServiceItem)) return;
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
      setFieldErrors((previous) => {
        const key = `taxRows.${absoluteIndex}.${field}`;
        if (!previous[key]) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const addTaxRow = useCallback(() => {
    setTaxRows((previous) => {
      const nextRows = [...previous, EMPTY_TAX_ROW];
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
    setFieldErrors({});

    if (activeTab === "taxDetails") {
      setTaxRows([EMPTY_TAX_ROW]);
      setTaxPage(0);
      return;
    }

    setForm((previous) => {
      if (activeTab === "inventoryDetails") {
        return {
          ...previous,
          brand: "",
          dimensionUnit: "",
          weight: "",
          weightUnit: "",
          dimensionLength: "",
          dimensionWidth: "",
          dimensionHeight: "",
          valuationMethod: "",
          trackingMethod: "",
          reorderLevel: "",
          minStockLevel: "",
          maxStockLevel: "",
          expiryDate: "",
          manufacturingDate: "",
          shelfLife: "",
          endOfLife: "",
          trackInventory: false,
          has_batch_no: false,
          batchNo: "",
          create_new_batch: false,
          has_expiry_date: false,
        };
      }

      return {
        ...previous,
        itemName: "",
        itemGroup: "",
        itemClassCode: "",
        itemTypeCode: "",
        originNationCode: "",
        packagingUnitCode: "",
        packingUnit: 1,
        packingSize: 1,
        svcCharge: "",
        ins: "",
        sellingPrice: "",
        buyingPrice: "",
        unitOfMeasureCd: "",
        description: "",
        sku: "",
        taxPreference: "",
        preferredVendor: "",
        preferredVendorName: "",
        salesAccount: "",
        purchaseAccount: "",
        countryCode: "",
      };
    });
  }, [activeTab, resetDirty, setForm]);

  const handleFormChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      handleForm(event);
      const { name } = event.target;
      setFieldErrors((previous) => {
        if (!previous[name]) return previous;
        const next = { ...previous };
        delete next[name];
        return next;
      });
    },
    [handleForm],
  );

  const showValidationError = useCallback((scope: "all" | "current") => {
    const error =
      scope === "all"
        ? getFirstValidationError(taxRows)
        : getValidationErrorForTab(activeTab, taxRows);
    if (!error) {
      setFieldErrors({});
      return false;
    }

    setFieldErrors({ [error.field ?? error.tab]: error.message });
    return true;
  }, [activeTab, getFirstValidationError, getValidationErrorForTab, taxRows]);

  const handleSaveClick = useCallback(async () => {
    const hasError = showValidationError("all");
    if (!hasError) {
      resetDirty();
      await handleSave(undefined, taxRows);
    }
  }, [handleSave, resetDirty, showValidationError, taxRows]);

  const handleNextClick = useCallback(() => {
    if (!showValidationError("current")) {
      setFieldErrors({});
    }
    handleNext(taxRows);
  }, [handleNext, showValidationError, taxRows]);

  if (!isOpen) return null;

 const shouldShowInventory = !isServiceItem && Boolean(form.trackInventory);

  const tabs: ItemModalTab[] = shouldShowInventory
    ? ["details", "taxDetails", "inventoryDetails"]
    : ["details", "taxDetails"];
  const currentTabIndex = tabs.indexOf(activeTab);

  const handleFormSubmit = async () => {
    const result = await handleSave(undefined, taxRows);
    if (result !== false) resetDirty();
    return result !== false;
  };

  const footer = (
    <>

      <ModalFooter
        onCancel={handleCloseRequest}
        onReset={handleReset}
        onSubmit={handleFormSubmit}
        onNext={
          activeTab === "inventoryDetails" ||
            (activeTab === "taxDetails" && isServiceItem)
            ? undefined
            : handleNextClick
        }
        currentTab={currentTabIndex}
        totalTabs={tabs.length}
        isSubmitting={loading}
      />
    </>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseRequest}
      title={isEditMode ? "Edit Item" : "Add Item"}
      subtitle="Add and manage item details"
      icon={Package}
      footer={footer}
      customWidth="min(92vw, 1280px)"
      height="75vh"
      summaryBar={<ItemSummaryBar form={form} taxRows={taxRows} />}
    >

      <form
        id={itemFormId}
        onChange={markDirty}
        onSubmit={(event) => {
          void handleSubmit(event, taxRows);
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
           {!isServiceItem && Boolean(form.trackInventory) && (
              <button
                type="button"
                onClick={() => handleTabChange("inventoryDetails")}
                className={[
                  "border-b-2 bg-transparent px-1 py-2.5 text-sm font-semibold tracking-wide transition-all",
                  activeTab === "inventoryDetails"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-main",
                ].join(" ")}
              >
                Inventory Details
              </button>
            )}
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
                 isServiceItem={isServiceItem} 
                onFormChange={handleFormChange}
                setField={setField}
                errors={fieldErrors}
              />

              {/* Row 2: Packing Unit, UOM, SKU, Country, SVC Charge, Insurance, Taxable */}
              <AdditionalDetailsSection
                form={form}
                onFormChange={handleFormChange}
                onToggleChange={handleToggleChange}
                setField={setField}
                errors={fieldErrors}
              />

              {/* Row 3: Sales & Purchase */}
              <PricingSection
                form={form}
               
                
                onFormChange={handleFormChange}
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
              errors={fieldErrors}
            />
          )}

          {activeTab === "inventoryDetails" && (
            <InventorySection
              form={form}
              isServiceItem={isServiceItem}
              onFormChange={handleFormChange}
              setField={setField}
            />
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ItemModal;
