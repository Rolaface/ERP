import { useState, useCallback, useEffect } from "react";
import type { RestrictedItem } from "../components/selects/customer group/ItemRescritionSelect";
import type { CustomerGroupPayload } from "../api/customerGroupApi";

export interface CustomerGroupForm {
  customerGroupName: string;
  parentCustomerGroup: string;
  isGroup: boolean;
  defaultPriceList: string;
  paymentTerms: string;
}

export type RestrictionMode = "Allow" | "Deny";

const INITIAL_FORM: CustomerGroupForm = {
  customerGroupName: "",
  parentCustomerGroup: "",
  isGroup: false,
  defaultPriceList: "",
  paymentTerms: "",
};

export const ITEMS_PER_PAGE = 5;

export function useCustomerGroupModal(initialData?: any) {
  const [form, setForm] = useState<CustomerGroupForm>(INITIAL_FORM);
  const [restrictionMode, setRestrictionMode] = useState<RestrictionMode>("Allow");
  const [restrictedItems, setRestrictedItems] = useState<RestrictedItem[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (initialData) {
      setForm({
        customerGroupName: initialData.customer_group_name || initialData.name || "",
        parentCustomerGroup: initialData.parent_customer_group || "",
        isGroup: initialData.is_group === 1 || initialData.isGroup === true,
        defaultPriceList: initialData.default_price_list || "",
        paymentTerms: initialData.payment_terms || "",
      });

      if (initialData.restrictions) {
        setRestrictionMode(initialData.restrictions.restriction_mode === "Deny" ? "Deny" : "Allow");
        setRestrictedItems(
          initialData.restrictions.items?.map((item: any) => ({
            id: item.item,
            itemName: item.item,
          })) || []
        );
      } else {
        setRestrictionMode("Allow");
        setRestrictedItems([]);
      }
    } else {
      resetModal();
    }
  }, [initialData]);

  useEffect(() => {
    if (restrictedItems.length === 0) return;
    const lastPage = Math.floor((restrictedItems.length - 1) / ITEMS_PER_PAGE);
    if (lastPage !== page) setPage(lastPage);
  }, [restrictedItems.length]);

  const paginatedItems = restrictedItems.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(restrictedItems.length / ITEMS_PER_PAGE);
  const hasPagination = restrictedItems.length > ITEMS_PER_PAGE || page > 0;

  const goToPrevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goToNextPage = useCallback(
    () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    [totalPages]
  );

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    []
  );

  const toggleRestrictionMode = useCallback(() => {
    setRestrictionMode((prev) => (prev === "Allow" ? "Deny" : "Allow"));
  }, []);

  const addRestrictedItem = useCallback((item: RestrictedItem) => {
    setRestrictedItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeRestrictedItem = useCallback(
    (id: string) => {
      setRestrictedItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        const newTotalPages = Math.ceil(next.length / ITEMS_PER_PAGE);
        if (page >= newTotalPages && page > 0) {
          setPage(page - 1);
        }
        return next;
      });
    },
    [page]
  );

  const resetModal = useCallback(() => {
    setForm(INITIAL_FORM);
    setRestrictionMode("Allow");
    setRestrictedItems([]);
    setPage(0);
  }, []);

  const buildPayload = useCallback((): CustomerGroupPayload => ({
    customer_group_name: form.customerGroupName,
    parent_customer_group: form.parentCustomerGroup || "All Customer Groups",
    is_group: form.isGroup ? 1 : 0,
    default_price_list: form.defaultPriceList,
    payment_terms: form.paymentTerms,
    restrictions:
      restrictedItems.length > 0
        ? {
            restriction_mode: restrictionMode, 
            enabled: 1,
            items: restrictedItems.map((item) => ({
              target_type: "Item",
              item: item.id,
            })),
          }
        : undefined,
  }), [form, restrictionMode, restrictedItems]);

  const isValid = form.customerGroupName.trim().length > 0;

  return {
    form,
    restrictionMode,
    restrictedItems,
    isValid,
    page,
    paginatedItems,
    totalPages,
    hasPagination,
    goToPrevPage,
    goToNextPage,
    ITEMS_PER_PAGE,
    handleFormChange,
    toggleRestrictionMode,
    addRestrictedItem,
    removeRestrictedItem,
    resetModal,
    buildPayload,
  };
}