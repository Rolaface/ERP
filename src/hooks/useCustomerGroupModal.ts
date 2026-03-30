import { useState, useCallback, useEffect } from "react";
import type { RestrictedItem } from "../components/selects/customer group/ItemRescritionSelect";

// ─── Types 

export interface CustomerGroupForm {
  customerGroupName: string;
  defaultPriceList: string;
  defaultPaymentTerms: string;
}

export type RestrictionMode = "allowed" | "disallowed";

export interface CustomerGroupPayload {
  form: CustomerGroupForm;
  restrictionMode: RestrictionMode;
  restrictedItems: RestrictedItem[];
}

// ─── Constants 

const INITIAL_FORM: CustomerGroupForm = {
  customerGroupName: "",
  defaultPriceList: "",
  defaultPaymentTerms: "",
};

export const ITEMS_PER_PAGE = 5;

// ─── Hook 

export function useCustomerGroupModal() {
  const [form, setForm] = useState<CustomerGroupForm>(INITIAL_FORM);
  const [restrictionMode, setRestrictionMode] = useState<RestrictionMode>("allowed");
  const [restrictedItems, setRestrictedItems] = useState<RestrictedItem[]>([]);
  const [page, setPage] = useState(0);


  useEffect(() => {
    if (restrictedItems.length === 0) return;
    const lastPage = Math.floor((restrictedItems.length - 1) / ITEMS_PER_PAGE);
    if (lastPage !== page) setPage(lastPage);
  }, [restrictedItems.length]);

  // ── Derived: items on current page 

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

  // ── Form field change 

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // ── Toggle allowed / disallowed 

  const toggleRestrictionMode = useCallback(() => {
    setRestrictionMode((prev) => (prev === "allowed" ? "disallowed" : "allowed"));
  }, []);

  // ── Add item 

  const addRestrictedItem = useCallback((item: RestrictedItem) => {
    setRestrictedItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev; 
      return [...prev, item];
    });
  }, []);

  // ── Remove item 

  const removeRestrictedItem = useCallback(
    (id: string) => {
      setRestrictedItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        // If removing the last item on the current page, step back one page
        const newTotalPages = Math.ceil(next.length / ITEMS_PER_PAGE);
        if (page >= newTotalPages && page > 0) {
          setPage(page - 1);
        }
        return next;
      });
    },
    [page]
  );

  // ── Reset 

  const resetModal = useCallback(() => {
    setForm(INITIAL_FORM);
    setRestrictionMode("allowed");
    setRestrictedItems([]);
    setPage(0);
  }, []);

  // ── Build payload 

  const buildPayload = useCallback((): CustomerGroupPayload => ({
    form,
    restrictionMode,
    restrictedItems,
  }), [form, restrictionMode, restrictedItems]);

  // ── Validation 

  const isValid = form.customerGroupName.trim().length > 0;

  return {
    // state
    form,
    restrictionMode,
    restrictedItems,
    isValid,

    // pagination
    page,
    paginatedItems,
    totalPages,
    hasPagination,
    goToPrevPage,
    goToNextPage,
    ITEMS_PER_PAGE,

    // handlers
    handleFormChange,
    toggleRestrictionMode,
    addRestrictedItem,
    removeRestrictedItem,
    resetModal,
    buildPayload,
  };
}