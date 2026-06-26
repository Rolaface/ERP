import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
// import type { ProformaInvoice, InvoiceItem } from "../types/invoice";
import { ProformaInvoice, InvoiceItem } from "../types/proformaInvoice";
import { getStockReport } from "../api/stockApi";
import { getRolaCountryList } from "../api/lookupApi";

import { getExchangeRate } from "../api/currencyExchangeApi";

import { showApiError, showValidationError } from "../utils/alert";
import {
  DEFAULT_INVOICE_FORM,
  EMPTY_ITEM,
  EMPTY_TERMS,
} from "../constants/profromaInvoiceConstants";
import dayjs from "dayjs";

// ─── Constants

const ITEMS_PER_PAGE = 5;
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

// ─── Helpers

const getDefaultBank = (accounts: any[] = []) =>
  accounts.find(
    (a) => (a.default === "1" || a.default === 1) && a.bankName?.trim(),
  ) ??
  accounts.find((a) => a.bankName?.trim()) ??
  null;

type NestedSection =
  | "billingAddress"
  | "shippingAddress"
  | "paymentInformation";

const calculateDueDate = (invoiceDate: string, terms: string) => {
  if (!invoiceDate) return "";

  // Add this fallback for when terms are empty
  if (!terms)
    return dayjs(invoiceDate, ["DD-MMM-YYYY", "YYYY-MM-DD"]).format(
      "YYYY-MM-DD",
    );

  const match = terms.match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;

  let date = dayjs(invoiceDate, "DD-MMM-YYYY", true);
  if (!date.isValid()) date = dayjs(invoiceDate, "YYYY-MM-DD", true);
  if (!date.isValid()) return "";

  return date.add(days, "day").format("YYYY-MM-DD");
};

const NUM_FIELDS = [
  "quantity",
  "price",
  "discount",
  "vatRate",
  "boxStart",
  "boxEnd",
];

// ─── Payload Builder ──────────────────────────────────────────────────────────
// Maps internal formData → new API payload shape

export function buildInvoicePayload(
  formData: ProformaInvoice,
  totals: { subTotal: number; totalTax: number; grandTotal: number },
) {
  const items = formData.items
    .filter((it) => it.itemCode)
    .map((item) => ({
      itemCode: item.itemCode,
      quantity: Number(item.quantity),
      rate: Number(item.price),
      warehouse: item.warehouse ?? formData.warehouse ?? "",
      batch_no: item.batchNo ?? "",
      box_start: item.boxStart ?? "",
      box_end: item.boxEnd ?? "",
      ...(item.mfgDate ? { mfg_date: item.mfgDate } : {}),
      ...(item.expDate ? { exp_date: item.expDate } : {}),
      description: item.description ?? "",
      discount: Number(item.discount ?? 0),
      vatRate: String(item.vatRate ?? 0),
      vatCode: item.vatCode ?? "",
    }));
  const mappedTaxes = (formData.taxes || []).map((t: any) => ({
    chargeType: t.chargeType,
    accountHead: t.accountHead,
    description: t.description || "",
    ...(t.chargeType === "Actual"
      ? { amount: Number(t.amount) || 0 }
      : { rate: t.rate ?? 0 }),
  }));
  return {
    customerId: formData.customerId,
    currency: formData.currencyCode,
    exchangeRate: formData.exchangeRt ?? "1",
    postingDate: formData.dateOfInvoice,
    validTill: formData.validTill,
    tax_category: formData.taxCategory,
    updateStock: formData.updateStock ?? true,
    paymentMode: formData.mode,
    payment_mode: formData.payment_mode,
    warehouse: formData.warehouse ?? "",
    billingAddress: formData.billingAddress ?? "",
    shippingAddress: formData.shippingAddress ?? "",
    ...(formData.taxCategory === "Export"
      ? { destnCountryCd: formData.destnCountryCd ?? "" }
      : {}),
    ...(formData.lpoNumber ? { lpoNumber: formData.lpoNumber } : {}),
    paymentInformation: formData.paymentInformation,
    items,
    terms: formData.terms,

    ...(formData.invoiceNumber
      ? { invoiceNumber: formData.invoiceNumber }
      : {}),
    // Computed totals
    subTotal: totals.subTotal,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    // Pass through address objects for reference
    addresses: formData.addresses,
    taxes: mappedTaxes,
    salesTaxTemplate: formData.salesTaxTemplate ?? "",
  };
}

export const useProformaInvoiceForm = (
  isOpen: boolean,
  _onClose: () => void,
  _onSubmit?: (data: any) => void,
  mode?: "invoice" | "proforma" | "edit",
  initialData?: any,
) => {
  const [formData, setFormData] = useState<ProformaInvoice>({
    ...DEFAULT_INVOICE_FORM,
    terms: { ...EMPTY_TERMS },
    invoiceCharges: [],
    addresses: {},
    taxes: [],
    salesTaxTemplate: "",
  });

  // Set today's date on open
  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      dateOfInvoice: prev.dateOfInvoice || today,
    }));
  }, [isOpen]);

  // useEffect(() => {
  //   const terms =
  //     formData.terms?.selling?.payment?.dueDates ||
  //     formData.paymentInformation?.paymentTerms;

  //   if (!terms || !formData.dateOfInvoice) return;

  //   const due = calculateDueDate(
  //     formData.dateOfInvoice,
  //     terms,
  //   );

  //   setFormData((prev) => ({
  //     ...prev,
  //     dueDate: due,
  //   }));
  // }, [
  //   formData.dateOfInvoice,
  //   formData.terms?.selling?.payment?.dueDates,
  //   formData.paymentInformation?.paymentTerms,
  // ]);
  // Auto-calculate validTill date from payment terms
  useEffect(() => {
    if (!formData.dateOfInvoice) return;

    const dueDatesValue = formData.terms?.selling?.payment?.dueDates;

    // If dueDates is explicitly set (even empty), use it
    // If not set at all (null/undefined), fall back to paymentTerms
    const terms =
      dueDatesValue != null
        ? dueDatesValue
        : (formData.paymentInformation?.paymentTerms ?? "");

    // calculateDueDate handles "" → returns invoiceDate (today)
    const due = calculateDueDate(formData.dateOfInvoice, terms);

    if (due) {
      setFormData((prev) => ({
        ...prev,
        validTill: due, // Changed from dueDate to validTill
      }));
    }
  }, [
    formData.dateOfInvoice,
    formData.terms?.selling?.payment?.dueDates,
    formData.paymentInformation?.paymentTerms,
  ]);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNameDisplay, setCustomerNameDisplay] = useState("");
  const [page, setPage] = useState(0);
  const [chargePage, setChargePage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "details" | "address" | "otherCharges" | "terms"
  >("details");

  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(
    null,
  );

  const shippingEditedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const lastCurrencyRef = useRef<string>("");
  const lastRateRef = useRef<number>(1);
  const customerTaxCategoryRef = useRef<string>("");
  const enableExchange = mode === "proforma";
  const [baseCurrency, setBaseCurrency] = useState<string>("");

  const getBaseCurrencyFromStorage = () => {
    try {
      const raw = localStorage.getItem("company-info");
      if (!raw) return "";

      const parsed = JSON.parse(raw);
      return parsed?.state?.baseCurrency || "";
    } catch {
      return "";
    }
  };

  //   useEffect(() => {
  //     if (!isOpen) return;
  //     if (mode === "edit" && initialData?.id) {
  //       setFormDataFromInvoice(initialData);
  //     }
  //   }, [isOpen, initialData, mode]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && (initialData?.id || initialData?.proformaId)) {
      setFormDataFromInvoice(initialData);
    }
  }, [isOpen, initialData, mode]);

  useEffect(() => {
    if (!isOpen || mode !== "edit") return;
    if (!(initialData?.id || initialData?.proformaId)) return;
    if (!formData.items.length) return;

    let cancelled = false;
    const taxCategoryForFetch =
      initialData?.taxCategory ?? initialData?.tax_category ?? "";

    (async () => {
      try {
        const res = await getStockReport(1, 1000, "", taxCategoryForFetch);
        const raw = res?.message?.data ?? [];
        if (cancelled) return;

        const piecesPerBoxMap = new Map<string, number>();
        raw.forEach((stockItem: any) => {
          piecesPerBoxMap.set(
            stockItem.item_code,
            Number(stockItem.piecesPerBox ?? 0),
          );
        });

        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((item: any) => {
            if (item._piecesPerBoxLoaded) return item;
            if (!item.itemCode) return item;
            if (item.piecesPerBox && item.piecesPerBox > 0) {
              return { ...item, _piecesPerBoxLoaded: true };
            }
            return {
              ...item,
              piecesPerBox: piecesPerBoxMap.get(item.itemCode) ?? 0,
              _piecesPerBoxLoaded: true,
            };
          }),
        }));
      } catch (err) {
        if (!cancelled) showApiError(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, initialData?.id, initialData?.proformaId]);

  useEffect(() => {
    if (!isOpen) return;

    const base = getBaseCurrencyFromStorage();

    console.log("Base Currency:", base);

    setBaseCurrency(base);
    lastCurrencyRef.current = base;

    setFormData((prev) => ({
      ...prev,
      currencyCode: prev.currencyCode || base,
    }));
  }, [isOpen]);

  // Exchange rate auto-fetch
  useEffect(() => {
    if (!isOpen || !enableExchange) return;
    const code = String(formData.currencyCode ?? "")
      .trim()
      .toUpperCase();
    const base = baseCurrency.trim().toUpperCase();
    if (!code || !base || code === base) {
      setExchangeRateLoading(false);
      setExchangeRateError(null);
      if (mode !== "edit") {
        setFormData((prev) => {
          if (prev.exchangeRt === "1") return prev;
          return { ...prev, exchangeRt: "1" };
        });
      }
      return;
    }

    let cancelled = false;
    setExchangeRateLoading(true);
    setFormData((prev) => {
      if (prev.exchangeRt === "1") return prev;
      return { ...prev, exchangeRt: "1" };
    });
    setExchangeRateError(null);

    getExchangeRate({
      from_currency: code,
      to_currency: baseCurrency,
      transaction_date: formData.dateOfInvoice,
      args: "for_selling",
    })
      .then((res) => {
        if (cancelled) return;
        const rate = Number(res?.message);
        setFormData((prev) => ({
          ...prev,
          exchangeRt: Number.isFinite(rate) && rate > 0 ? String(rate) : "1",
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setExchangeRateError(err?.message || "Exchange rate not found");
        setFormData((prev) => {
          if (prev.exchangeRt === "1") return prev;
          return { ...prev, exchangeRt: "1" };
        });
        showApiError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setExchangeRateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    formData.currencyCode,
    formData.dateOfInvoice,
    formData.customerId,
    enableExchange,
    baseCurrency,
  ]);

  // Sync shipping address when sameAsBilling
  useEffect(() => {
    if (!sameAsBilling) return;
    setFormData((prev) => ({
      ...prev,
      shippingAddress: prev.billingAddress || "",
    }));
  }, [formData.billingAddress, sameAsBilling]);

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const invoiceType = String(formData.taxCategory ?? "")
      .trim()
      .toLowerCase();

    if (!formData.customerId) {
      throw new Error("Please select a customer");
    }
    if (!formData.dateOfInvoice) {
      throw new Error("Please select date of Proforma Invoice");
    }
    if (!formData.validTill) {
      throw new Error("Please select due date");
    }
    if (!formData.items.length) {
      throw new Error("Please add at least one item");
    }
    if (!formData.paymentInformation?.paymentMethod) {
      throw new Error("Please select a payment method");
    }

    formData.items.forEach((it, idx) => {
      if (!it.itemCode) {
        setPage(Math.floor(idx / ITEMS_PER_PAGE));
        throw new Error(`Item ${idx + 1}: Please select item`);
      }
      if (!it.quantity || it.quantity <= 0) {
        setPage(Math.floor(idx / ITEMS_PER_PAGE));
        throw new Error(`Item ${idx + 1}: Quantity must be greater than 0`);
      }
      if (!it.price || it.price <= 0) {
        setPage(Math.floor(idx / ITEMS_PER_PAGE));
        throw new Error(`Item ${idx + 1}: Price must be greater than 0`);
      }
    });

    return true;
  };

  // ─── Input handlers ─────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    section?: NestedSection,
  ) => {
    const { name, value } = e.target;

    if (name === "updateStock") {
      setFormData((prev) => ({
        ...prev,
        updateStock: (e.target as HTMLInputElement).checked,
      }));
      return;
    }

    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), [name]: value },
      }));
      if (section === "shippingAddress" && !sameAsBilling) {
        shippingEditedRef.current = true;
      }
    } else {
      if (name === "currencyCode") {
        if (!enableExchange) {
          setFormData((prev) => ({
            ...prev,
            currencyCode: value,
            exchangeRt: "1",
          }));
          return;
        }
        setExchangeRateLoading(true);
        setExchangeRateError(null);
        setFormData((prev) => ({ ...prev, [name]: value }));
        return;
      }
      if (name === "lpoNumber") {
        const digitsOnly = String(value ?? "")
          .replace(/\D/g, "")
          .slice(0, 10);
        setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getCountryCode = (
    countries: { code: string; name: string }[],
    countryName?: string,
  ): string => {
    if (!countryName || !countries.length) return "";
    const n = countryName.trim().toLowerCase();
    const byCode = countries.find((c) => c.code.toLowerCase() === n);
    if (byCode) return byCode.code;
    const byName = countries.find((c) => c.name.toLowerCase().includes(n));
    if (byName) return byName.code;
    const reverse = countries.find((c) => n.includes(c.name.toLowerCase()));
    if (reverse) return reverse.code;
    if (n === "usa" || n === "united states of america") return "US";
    if (n === "uk" || n === "united kingdom") return "GB";
    if (n === "uae") return "AE";
    return "";
  };

  const handleCustomerSelect = async ({
    name,
    id,
  }: {
    name: string;
    id: string;
  }) => {
    setCustomerNameDisplay(name);
    setFormData((p) => ({ ...p, customerId: id }));

    try {
      const [customerRes, companyRes] = await Promise.all([
        getCustomerByCustomerCode(id),
        getCompanyById(COMPANY_ID),
      ]);

      if (!customerRes || customerRes?.message?.status_code !== 200) return;
      const data = customerRes?.message?.data;
      const company = companyRes?.data;
      const taxCategory = data?.customerTaxCategory || "";
      customerTaxCategoryRef.current = taxCategory;
      setFormData((prev) => ({
        ...prev,
        taxCategory,
      }));

      const countryLookupList = await getRolaCountryList();
      const formattedCountries = countryLookupList.map((c: any) => ({
        code: c.code || c.name,
        name: c.country_name || c.name,
      }));

      setCustomerDetails({ ...data });
      const billingAddressObj = data.addresses?.find(
        (addr: any) => addr.type === "Billing",
      );
      const shippingAddressObj = data.addresses?.find(
        (addr: any) => addr.type === "Shipping",
      );
      const countryCode = getCountryCode(
        formattedCountries,
        shippingAddressObj?.country || billingAddressObj?.country,
      );

      const paymentInformation = {
        paymentTerms:
          data?.terms?.selling?.payment?.dueDates ??
          company?.terms?.selling?.payment?.dueDates ??
          "",
        paymentMethod: "01",
        bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
        accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
        routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
        swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
      };

      setFormData((prev) => {
        const billingId = billingAddressObj?.id || "";
        const shippingId = sameAsBilling
          ? billingId
          : shippingAddressObj?.id || "";
        return {
          ...prev,
          currencyCode: data.currency || prev.currencyCode,
          destnCountryCd:
            taxCategory === "Export" ? countryCode : prev.destnCountryCd,
          taxCategory,
          billingAddress: billingId,
          shippingAddress: shippingId,
          paymentInformation,
          terms: {
            selling:
              data?.terms?.selling ??
              company?.terms?.selling ??
              prev.terms?.selling ??
              EMPTY_TERMS.selling,
          },
        };
      });
    } catch (err: any) {
      console.error("Failed to load customer data", err);
      showApiError("Failed to load customer details");
    }
  };

  const handleItemChange = (
    idx: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const isNum = NUM_FIELDS.includes(name);

    setFormData((prev) => {
      const items = [...prev.items];
      let nextValue: any = value;
      if (isNum) {
        nextValue =
          value === "" || value === null
            ? null
            : Number.isFinite(Number(value))
              ? Number(value)
              : null;
      }
      if (name === "quantity" && nextValue !== null) {
        const item = items[idx];
        if (!item._skipCap) {
          if (!item.isServiceItem) {
            const stockAvailable = item.availableQty ?? item.qty ?? 0;
            const thisRowOriginal = Number(item.originalQty ?? 0);

            // Total pool = actual stock remaining + what this invoice already reserved
            const available = stockAvailable + thisRowOriginal;

            // How much other rows of same batch are using
            const usedByOthers = items
              .filter((x, xIdx) => x.batchNo === item.batchNo && xIdx !== idx)
              .reduce((sum, x) => {
                const qty = Number(x.quantity || 0);
                const orig = Number(x.originalQty || 0);
                // Net consumption = current qty - what was already allocated
                // (original was already counted in stockAvailable pool)
                return sum + Math.max(0, qty - orig);
              }, 0);

            const maxAllowed = Math.max(0, available - usedByOthers);
            if (nextValue > maxAllowed) {
              nextValue = maxAllowed;
              showValidationError(
                `Only ${maxAllowed} items remaining in batch ${item.batchNo}`,
              );
            }
          }
        }
      }
      // ─────────────────────────────────────────────────────

      const updatedItem = { ...items[idx], [name]: nextValue, _skipCap: false };
      if (name === "quantity") {
        const piecesPerBox = Number(updatedItem.piecesPerBox || 0);

        if (piecesPerBox > 0) {
          const totalBoxes = Math.ceil(
            Number(updatedItem.quantity || 0) / piecesPerBox,
          );

          const boxStart =
            Number(updatedItem.boxStart || 0) > 0
              ? Number(updatedItem.boxStart)
              : idx === 0
                ? 1
                : Number(items[idx - 1]?.boxEnd || 0) + 1;

          updatedItem.boxStart = boxStart;
          updatedItem.boxEnd = boxStart + totalBoxes - 1;
        }
      }
      if (
        (name === "boxStart" || name === "boxEnd") &&
        updatedItem.piecesPerBox
      ) {
        const start = Number(updatedItem.boxStart || 0);
        const end = Number(updatedItem.boxEnd || 0);
        const piecesPerBox = Number(updatedItem.piecesPerBox || 0);

        if (start > 0 && end >= start) {
          const totalBoxes = end - start + 1;
          updatedItem.quantity = totalBoxes * piecesPerBox;
        }
      }
      const start = Number(updatedItem.boxStart || 0);
      const end = Number(updatedItem.boxEnd || 0);

      if (idx > 0 && name === "boxStart") {
        const prevEnd = Number(items[idx - 1]?.boxEnd || 0);
        const expected = prevEnd + 1;
        if (prevEnd > 0 && start !== expected && start > expected) {
          showValidationError(
            `Row ${idx + 1}: Box must start from ${expected}`,
          );
          return prev;
        }
      }

      items[idx] = updatedItem;
      if (name === "boxEnd" && end >= start && items[idx + 1]) {
        items[idx + 1] = { ...items[idx + 1], boxStart: end + 1 };
      }
      return { ...prev, items };
    });
  };
  //charge temeplete--------------------
  // const handleTemplateSelect = (templateName: string, taxes: any[] = []) => {
  //   setFormData((prev) => {
  //     // calculate subtotal first
  //     const subTotal = prev.items.reduce((sum, item) => {
  //       const qty = Number(item.quantity || 0);
  //       const price = Number(item.price || 0);
  //       const discount = Number(item.discount || 0);
  //       const net = qty * price * (1 - discount / 100);
  //       return sum + net;
  //     }, 0);

  //     const mappedTaxes = taxes.map((t: any) => {
  //       const rate = Number(t.rate) || 0;

  //       const amount =
  //         t.charge_type === "Actual"
  //           ? Number(t.tax_amount) || 0
  //           : (subTotal * rate) / 100;
  //       const isActual = t.charge_type === "Actual";

  //       return {
  //         chargeType: t.charge_type,
  //         accountHead: t.account_head,
  //         description: t.description || "",
  //         ...(isActual
  //           ? { amount: Number(t.tax_amount) || 0 }
  //           : { rate: Number(t.rate) || 0 }),
  //       };
  //     });

  //     return {
  //       ...prev,
  //       taxes: mappedTaxes,
  //       salesTaxTemplate: templateName,
  //     };
  //   });
  // };
  const handleTemplateSelect = (templateName: string, taxes: any[] = []) => {
    setFormData((prev) => {
      // calculate subtotal first
      const subTotal = prev.items.reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const discount = Number(item.discount || 0);
        const net = qty * price * (1 - discount / 100);
        return sum + net;
      }, 0);

      const mappedTaxes = taxes.map((t: any) => {
        const rate = Number(t.rate) || 0;
        const isActual = t.charge_type === "Actual";
        const amount = isActual
          ? Number(t.tax_amount) || 0
          : (subTotal * rate) / 100;

        return {
          chargeType: t.charge_type || "",
          accountHead: t.account_head || "",
          description: t.description || "",
          rate: isActual ? null : rate, // Explicitly provide rate (or null)
          amount: amount, // Explicitly provide amount
        };
      });

      return {
        ...prev,
        taxes: mappedTaxes,
        salesTaxTemplate: templateName,
      };
    });
  };
  const handleTaxChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updated = [...(prev.taxes || [])];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return {
        ...prev,
        taxes: updated,
      };
    });
  };

  const updateItemDirectly = (index: number, updated: Partial<InvoiceItem>) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const updatedItem = {
        ...items[index],
        ...updated,
      };

      items[index] = updatedItem;
      return { ...prev, items };
    });
  };

  const handleBulkItemChange = (field: keyof InvoiceItem, value: string) => {
    if (field !== "warehouse") return;
    setFormData((prev) => ({
      ...prev,
      warehouse: value,
      items: prev.items.map((item) => ({ ...item, warehouse: value })),
    }));
  };

  const addOtherCharge = () => {
    setFormData((prev: any) => ({
      ...prev,
      invoiceCharges: [
        ...(prev.invoiceCharges || []),
        { charge_type: "", amount: "" },
      ],
    }));
  };

  const handleOtherChargeChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    setFormData((prev: any) => {
      const updated = [...(prev.invoiceCharges || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, invoiceCharges: updated };
    });
  };

  const removeOtherCharge = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      invoiceCharges: prev.invoiceCharges.filter(
        (_: any, i: number) => i !== index,
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => {
      const items = [...prev.items];
      let start = 1;
      if (items.length > 0) {
        const lastEnd = Number(items[items.length - 1]?.boxEnd || 0);
        start = lastEnd ? lastEnd + 1 : 1;
      }
      items.push({
        ...EMPTY_ITEM,
        boxStart: start,
        warehouse: prev.warehouse || "",
      });
      setPage(Math.floor((items.length - 1) / ITEMS_PER_PAGE));
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setFormData((prev) => {
      if (prev.items.length === 1) return prev;
      const items = prev.items.filter((_, i) => i !== idx);
      const maxPage = Math.max(0, Math.ceil(items.length / ITEMS_PER_PAGE) - 1);
      setPage((p) => Math.min(p, maxPage));
      return { ...prev, items };
    });
  };

  const duplicateItem = (absoluteIndex: number) => {
    setFormData((prev) => {
      const source = prev.items[absoluteIndex];
      if (!source) return prev;
      const copy = { ...source };
      const newItems = [...prev.items];
      newItems.splice(absoluteIndex + 1, 0, copy);
      setPage(Math.floor((absoluteIndex + 1) / ITEMS_PER_PAGE));
      return { ...prev, items: newItems };
    });
  };

  const setFormDataFromInvoice = (invoice: any) => {
    isLoadingRef.current = true;
    // charges[] from GET response map to taxes[] in formData
    // (taxes[] in GET is always empty; actual applied charges are in charges[])
    const mappedTaxesFromCharges =
      Array.isArray(invoice.charges) && invoice.charges.length > 0
        ? invoice.charges.map((ch: any) => ({
            chargeType: ch.chargeType ?? "Actual",
            accountHead: ch.accountHead ?? "",
            description: ch.description ?? "",
            rate: Number(ch.rate) || 0,
            amount: Number(ch.amount) || 0,
          }))
        : Array.isArray(invoice.taxes) && invoice.taxes.length > 0
          ? invoice.taxes.map((t: any) => ({
              chargeType: t.chargeType ?? "",
              accountHead: t.accountHead ?? "",
              description: t.description ?? "",
              rate: Number(t.rate) || 0,
              amount: Number(t.amount) || 0,
            }))
          : [];

    setFormData((prev: any) => ({
      ...prev,
      invoiceNumber: invoice.id ?? invoice.invoiceNumber,
      customerId: invoice.customerId ?? prev.customerId,
      invoiceType: invoice.invoiceType ?? "",

      // FIX 1: API returns `taxCategory` (camelCase), hook was checking `tax_category`
      taxCategory:
        invoice.taxCategory ?? invoice.tax_category ?? prev.taxCategory,

      // FIX 2: Map API `status` to `invoiceStatus` used by modal
      invoiceStatus: invoice.status ?? prev.invoiceStatus,

      // FIX 3: Map API `validTill` used by modal
      validTill: invoice.validTill,

      mode: invoice.paymentMode ?? prev.mode ?? "",
      payment_mode: invoice.payment_mode ?? prev.payment_mode ?? "",
      currencyCode: invoice.currency,
      dateOfInvoice: invoice.postingDate,
      exchangeRt:
        invoice.exchangeRate && Number(invoice.exchangeRate) > 0
          ? String(invoice.exchangeRate)
          : "1",
      destnCountryCd: invoice.destnCountryCd ?? "",
      updateStock: invoice.updateStock ?? true,
      warehouse: invoice.warehouse ?? prev.warehouse ?? "",
      // Use address IDs (not the HTML display strings) for the PUT payload
      billingAddress:
        invoice.customerAddressId ??
        invoice.billingAddress ??
        prev.billingAddress,
      shippingAddress:
        invoice.shippingAddressId ??
        invoice.shippingAddress ??
        prev.shippingAddress,
      paymentInformation: invoice.paymentInformation ?? prev.paymentInformation,
      taxes: mappedTaxesFromCharges,
      invoiceCharges:
        Array.isArray(invoice.invoiceCharges) &&
        invoice.invoiceCharges.length > 0
          ? invoice.invoiceCharges.map((ch: any) => ({
              charge_type: ch.charge_type ?? "",
              amount: String(ch.amount ?? ""),
            }))
          : [],
      terms: {
        selling: {
          general: invoice.terms?.selling?.general || "",
          delivery: invoice.terms?.selling?.delivery || "",
          cancellation: invoice.terms?.selling?.cancellation || "",
          warranty: invoice.terms?.selling?.warranty || "",
          liability: invoice.terms?.selling?.liability || "",
          payment: {
            phases:
              invoice.terms?.selling?.payment?.phases?.map((p: any) => ({
                id: p.id,
                name: p.name,
                percentage: String(p.percentage),
                condition: p.condition,
                credit_days: String(p.credit_days),
              })) || [],
            dueDates: invoice.terms?.selling?.payment?.dueDates || "",
            lateCharges: invoice.terms?.selling?.payment?.lateCharges || "",
            taxes: invoice.terms?.selling?.payment?.taxes || "",
            notes: invoice.terms?.selling?.payment?.notes || "",
          },
        },
      },
      items: (invoice.items || []).map((it: any) => {
        const quantity = Number(it.quantity);
        const price = Number(it.rate);
        const discount = Number(it.discount || 0);
        const discountAmount = quantity * price * (discount / 100);
        const totalInclusive = quantity * price - discountAmount;
        const exclusiveBase = Number(it.vatTaxableAmount || 0);
        const amount = totalInclusive - exclusiveBase;
        const taxRate =
          exclusiveBase > 0
            ? Number(((amount / exclusiveBase) * 100).toFixed(2))
            : 0;
        const taxTypes = (it.taxInfo || [])
          .flatMap((tax: any) => tax.taxRates || [])
          .map((r: any) => r.tax_type)
          .filter((t: string) => t && t.trim() !== "");
        return {
          itemCode: it.itemCode,
          itemName: it.itemName ?? "",
          description: it.description ?? "",
          quantity,
          price,
          discount,
          vatRate: it.taxInfo?.[0]?.totalTaxRate ?? taxRate,
          vatCode: it.itemTaxTemplate ?? it.vatCode ?? "",
          taxTypes: taxTypes,
          packingUnit: it.packingUnit ?? "",
          packingSize: it.packingSize ?? "",
          batchNo: it.batchNo ?? "",
          boxStart: Number(it.boxStart) || "",
          boxEnd: Number(it.boxEnd) || "",
          mfgDate: it.mfgDate ?? "",
          expDate: it.expDate ?? "",
          warehouse: it.warehouse ?? "",
          originalQty: Number(it.quantity),
          piecesPerBox: Number(it.piecesPerBox) || 0,
          _skipCap: true,
        };
      }),
    }));

    setCustomerDetails({ name: invoice.customerName, id: invoice.customerId });
    setCustomerNameDisplay(invoice.customerName ?? "");
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 0);
  };

  const setTerms = (selling: TermSection) => {
    setFormData((prev) => ({ ...prev, terms: { selling } }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (!checked) shippingEditedRef.current = false;
  };

  const handleReset = async () => {
    if (initialData) {
      setFormDataFromInvoice(initialData);
    } else {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const company = companyRes?.data;
        const today = new Date().toISOString().split("T")[0];
        const paymentTerms = company?.terms?.selling?.payment?.dueDates ?? "";
        const validTill = calculateDueDate(today, paymentTerms);

        setFormData({
          ...DEFAULT_INVOICE_FORM,
          invoiceCharges: [],
          salesTaxTemplate: "",
          dateOfInvoice: today,
          validTill,
          exchangeRt: "1",
          warehouse: "",
          updateStock: true,
          terms: { selling: company?.terms?.selling ?? EMPTY_TERMS.selling },
          paymentInformation: {
            ...DEFAULT_INVOICE_FORM.paymentInformation,
            paymentTerms,
            bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
            accountNumber:
              getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
            routingNumber:
              getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
            swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
          },
          shippingAddress: DEFAULT_INVOICE_FORM.billingAddress || "",
        });
      } catch (err) {
        console.error("Failed to re-load company defaults during reset", err);
        showApiError("Failed to reload company defaults");
        setFormData({ ...DEFAULT_INVOICE_FORM });
      }
    }
    shippingEditedRef.current = false;
    lastCurrencyRef.current = baseCurrency;
    lastRateRef.current = 1;
    customerTaxCategoryRef.current = "";
    setCustomerDetails(null);
    setCustomerNameDisplay("");

    setSameAsBilling(true);
    setPage(0);
    setActiveTab("details");
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  // Returns the mapped API payload or null if validation fails

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      validateForm();
      const payload = buildInvoicePayload(formData, {
        subTotal,
        totalTax,
        grandTotal,
      });
      return payload;
    } catch (error: any) {
      showValidationError(error?.message || "Validation error");
      return null;
    }
  };

  // ─── Computed totals ─────────────────────────────────────────────────────────

  const {
    subTotal,
    totalTax,
    grandTotal,
    totalQuantity,
    totalAmount,
    totalDiscount,
  } = useMemo(() => {
    let qty_sum = 0;
    let gross = 0;
    let disc_sum = 0;
    let sub = 0;
    let tax = 0;

    formData.items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 0);
      const vatRate = Number(item.vatRate || 0);

      const lineGross = qty * price;
      const lineDiscount = lineGross * (discount / 100);
      const lineNet = lineGross - lineDiscount;
      const lineTax = lineNet * (vatRate / 100);

      qty_sum += qty;
      gross += lineGross;
      disc_sum += lineDiscount;
      sub += lineNet;
      tax += lineTax;
    });

    return {
      totalQuantity: qty_sum,
      totalAmount: gross,
      totalDiscount: disc_sum,
      subTotal: sub,
      totalTax: tax,
      grandTotal: sub + tax,
    };
  }, [formData.items]);
  const paginatedItems = formData.items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const paginatedCharges = formData.invoiceCharges.slice(
    chargePage * ITEMS_PER_PAGE,
    (chargePage + 1) * ITEMS_PER_PAGE,
  );

  return {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    paginatedCharges,
    totals: {
      totalQuantity,
      totalAmount,
      totalDiscount,
      subTotal,
      totalTax,
      grandTotal,
    },
    ui: {
      page,
      setPage,
      activeTab,
      setActiveTab,

      isShippingOpen,
      setIsShippingOpen,
      sameAsBilling,
      chargePage,
      setChargePage,
      baseCurrency,
      chargeCount: formData.invoiceCharges.length,
      itemCount: formData.items.length,
      isExport:
        String(formData.taxCategory ?? "")
          .trim()
          .toLowerCase() === "export",
      isLocal:
        String(formData.taxCategory ?? "")
          .trim()
          .toLowerCase() === "lpo",
      isNonExport:
        String(formData.taxCategory ?? "")
          .trim()
          .toLowerCase() === "non-export",
      exchangeRateLoading: enableExchange ? exchangeRateLoading : false,
      exchangeRateError: enableExchange ? exchangeRateError : null,
    },
    actions: {
      validateForm,
      handleInputChange,
      handleCustomerSelect,

      handleItemChange,
      updateItemDirectly,
      addItem,
      removeItem,
      duplicateItem,
      setTerms,
      handleSameAsBillingChange,
      handleReset,
      handleSubmit,
      handleBulkItemChange,
      addOtherCharge,
      handleOtherChargeChange,
      removeOtherCharge,
      handleTemplateSelect,
      handleTaxChange,
    },
  };
};
