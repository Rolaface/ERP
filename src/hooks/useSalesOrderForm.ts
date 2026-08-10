import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { InvoiceItem } from "../types/proformaInvoice";
import { getRolaCountryList } from "../api/lookupApi";
import { useUnsavedChanges } from "./useUnsavedChanges";

import { getExchangeRate } from "../api/currencyExchangeApi";

import { showApiError, showValidationError } from "../utils/alert";
import { EMPTY_ITEM, EMPTY_TERMS } from "../constants/profromaInvoiceConstants";
import dayjs from "dayjs";

// ─── Types ──────────────────────────────────────────────────────────────────
// Sales Order form shape. Mirrors ProformaInvoice but swaps in Sales Order's
// actual fields (customer, deliveryDate, customerPoNo/customerPoDate) to
// match custom_api.api.selling.sales_order.{service,api,utils}.py

export interface SalesOrderForm {
  orderNumber?: string;
  title?: string;
  customerId: string;
  currencyCode: string;
  exchangeRt: string;
  postingDate: string;
  deliveryDate: string;
  customerPoNo?: string;
  customerPoDate?: string;
  taxCategory?: string;
  destnCountryCd?: string;
  billingAddress?: string;
  shippingAddress?: string;
  orderType?: string;
  warehouse?: string;
  mode?: string;
  payment_mode?: string;
  status?: string;
  docstatus?: number;
  paymentInformation: {
    paymentTerms?: string;
    paymentMethod?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  items: InvoiceItem[];
  invoiceCharges: any[];
  addresses: Record<string, any>;
  taxes: any[];
  salesTaxTemplate?: string;
  terms: { selling?: TermSection };
}

const DEFAULT_SALES_ORDER_FORM: SalesOrderForm = {
  customerId: "",
  currencyCode: "",
  exchangeRt: "1",
  postingDate: "",
  deliveryDate: "",
  customerPoNo: "",
  customerPoDate: "",
  taxCategory: "",
  destnCountryCd: "",
  billingAddress: "",
  shippingAddress: "",
  orderType: "Sales",
  warehouse: "",
  mode: "",
  paymentInformation: {
    paymentTerms: "",
    paymentMethod: "01",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
  },
  items: [{ ...EMPTY_ITEM }],
  invoiceCharges: [],
  addresses: {},
  taxes: [],
  salesTaxTemplate: "",
  terms: { selling: { ...EMPTY_TERMS.selling } },
};

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const calculateDueDate = (orderDate: string, terms: string) => {
  if (!orderDate) return "";
  const match = terms?.match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;
  let date = dayjs(orderDate, "DD-MMM-YYYY", true);
  if (!date.isValid()) date = dayjs(orderDate, "YYYY-MM-DD", true);
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
  "piecesPerBox",
];

// ─── Payload Builder ──────────────────────────────────────────────────────────
// Maps internal formData → the payload shape expected by
// custom_api.api.selling.sales_order.service.create_sales_order /
// update_sales_order

export function buildSalesOrderPayload(
  formData: SalesOrderForm,
  totals: { subTotal: number; totalTax: number; grandTotal: number },
) {
  const items = formData.items
    .filter((it: any) => it.itemCode)
    .map((item: any) => ({
      itemCode: item.itemCode,
      quantity: Number(item.quantity),
      rate: Number(item.price),
      uom: item.uom ?? item.unitOfMeasureCd ?? "",
      discount: Number(item.discount ?? 0),
      warehouse: item.warehouse ?? formData.warehouse ?? "",
      deliveryDate: item.deliveryDate || formData.deliveryDate,
      batchNo: item.batchNo ?? "",
      boxStart: item.boxStart ?? "",
      boxEnd: item.boxEnd ?? "",
      description: item.description ?? "",
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
    postingDate: formData.postingDate,
    deliveryDate: formData.deliveryDate,
    taxCategory: formData.taxCategory,
    orderType: formData.orderType ?? "Sales",
    payment_mode: formData.payment_mode,
    warehouse: formData.warehouse ?? "",
    billingAddress: formData.billingAddress ?? "",
    shippingAddress: formData.shippingAddress ?? "",
    ...(formData.taxCategory === "Export"
      ? { destnCountryCd: formData.destnCountryCd ?? "" }
      : {}),
    ...(formData.customerPoNo ? { customerPoNo: formData.customerPoNo } : {}),
    ...(formData.customerPoDate
      ? { customerPoDate: formData.customerPoDate }
      : {}),
    paymentInformation: formData.paymentInformation,
    items,
    terms: formData.terms,
    ...(formData.orderNumber ? { orderNumber: formData.orderNumber } : {}),
    // Computed totals (informational — backend recalculates from items/taxes)
    subTotal: totals.subTotal,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    addresses: formData.addresses,
    taxes: mappedTaxes,
    salesTaxTemplate: formData.salesTaxTemplate ?? "",
  };
}

export const useSalesOrderForm = (
  isOpen: boolean,
  _onClose: () => void,
  _onSubmit?: (data: any) => void,
  mode?: "create" | "edit",
  initialData?: any,
) => {
  const [formData, setFormData] = useState<SalesOrderForm>({
    ...DEFAULT_SALES_ORDER_FORM,
    terms: { selling: { ...EMPTY_TERMS.selling } },
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
      postingDate: prev.postingDate || today,
    }));
  }, [isOpen]);

  useEffect(() => {
    const terms =
      formData.terms?.selling?.payment?.dueDates ||
      formData.paymentInformation?.paymentTerms;

    if (!terms || !formData.postingDate) return;

    const due = calculateDueDate(formData.postingDate, terms);

    if (!formData.deliveryDate) {
      setFormData((prev) => ({
        ...prev,
        deliveryDate: due,
      }));
    }
  }, [
    formData.postingDate,
    formData.terms?.selling?.payment?.dueDates,
    formData.paymentInformation?.paymentTerms,
  ]);

  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNameDisplay, setCustomerNameDisplay] = useState("");
  const [page, setPage] = useState(0);
  const [chargePage, setChargePage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "details" | "address" | "otherCharges" | "terms" | "otherDetails"
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
  const customerSelectTokenRef = useRef(0);
  // Unlike Quotation/Proforma, a Sales Order is a firm commitment, so we
  // always auto-fetch the exchange rate rather than gating it behind a mode.
  const enableExchange = true;
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

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

  // Load edit data
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && (initialData?.id || initialData?.orderNumber)) {
      setFormDataFromOrder(initialData);
    }
  }, [isOpen, initialData, mode]);

  useEffect(() => {
    if (!isOpen) return;

    const base = getBaseCurrencyFromStorage();

    setBaseCurrency(base);
    lastCurrencyRef.current = base;

    setFormData((prev) => ({
      ...prev,
      currencyCode: prev.currencyCode || base,
    }));
  }, [isOpen]);

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
      transaction_date: formData.postingDate,
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
    formData.postingDate,
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
    if (!formData.customerId) {
      throw new Error("Please select a customer");
    }
    if (!formData.postingDate) {
      throw new Error("Please select date of Sales Order");
    }
    if (!formData.deliveryDate) {
      throw new Error("Please select a delivery date");
    }
    if (formData.deliveryDate < formData.postingDate) {
      throw new Error("Delivery Date cannot be before Posting Date");
    }
    if (!formData.items.length) {
      throw new Error("Please add at least one item");
    }
    if (!formData.payment_mode) {
      throw new Error("Please select mode of payment");
    }
    if (!formData.paymentInformation?.paymentMethod) {
      throw new Error("Please select a payment method");
    }

    formData.items.forEach((it: any, idx) => {
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
        markDirty();
        return;
      }
      if (name === "customerPoNo") {
        const digitsOnly = String(value ?? "")
          .replace(/\D/g, "")
          .slice(0, 10);
        setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        markDirty();
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    markDirty();
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

  const handleCustomerClear = () => {
    customerSelectTokenRef.current += 1;
    customerTaxCategoryRef.current = "";

    setCustomerDetails(null);
    setCustomerNameDisplay("");

    setFormData((prev) => ({
      ...prev,
      customerId: "",
      taxCategory: "",
      destnCountryCd: "",
      billingAddress: "",
      shippingAddress: sameAsBilling ? "" : prev.shippingAddress,
      paymentInformation: DEFAULT_SALES_ORDER_FORM.paymentInformation,
      terms: { selling: { ...EMPTY_TERMS.selling } },
    }));

    markDirty();
  };

  const handleCustomerSelect = async ({
    name,
    id,
  }: {
    name: string;
    id: string;
  }) => {
    if (!id) {
      handleCustomerClear();
      return;
    }

    const token = ++customerSelectTokenRef.current;

    setCustomerNameDisplay(name);
    setFormData((p) => ({ ...p, customerId: id }));
    markDirty();

    try {
      const [customerRes, companyRes] = await Promise.all([
        getCustomerByCustomerCode(id),
        getCompanyById(COMPANY_ID),
      ]);
      if (token !== customerSelectTokenRef.current) return;
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
      if (token !== customerSelectTokenRef.current) return;
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

      const updatedItem: any = {
        ...items[idx],
        [name]: nextValue,
        _skipCap: false,
      };

      if (
        (name === "boxStart" || name === "boxEnd") &&
        updatedItem.piecesPerBox
      ) {
        const start = Number(updatedItem.boxStart || 0);
        const end = Number(updatedItem.boxEnd || 0);
        const piecesPerBox = Number(updatedItem.piecesPerBox || 0);
        if (start > 0 && end >= start) {
          updatedItem.quantity = (end - start + 1) * piecesPerBox;
        }
      }

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
    markDirty();
  };

  // ─── Tax / charge template handling ───────────────────────────────────────

  const handleTemplateSelect = (templateName: string, taxes: any[] = []) => {
    setFormData((prev) => {
      const subTotal = prev.items.reduce((sum, item: any) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const discount = Number(item.discount || 0);
        const net = qty * price * (1 - discount / 100);
        return sum + net;
      }, 0);

      const mappedTaxes = taxes.map((t: any) => {
        const rate = Number(t.rate) || 0;
        const isActual = t.charge_type === "Actual";

        return {
          chargeType: t.charge_type,
          accountHead: t.account_head,
          description: t.description || "",
          ...(isActual
            ? { amount: Number(t.tax_amount) || 0 }
            : { rate: Number(t.rate) || 0 }),
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
      const updatedItem: any = { ...items[index], ...updated };

      const piecesPerBox = Number(updatedItem.piecesPerBox || 0);
      if (piecesPerBox > 0 && Number(updatedItem.quantity || 0) > 0) {
        const totalBoxes = Math.ceil(
          Number(updatedItem.quantity) / piecesPerBox,
        );
        updatedItem.boxEnd = Number(updatedItem.boxStart || 1) + totalBoxes - 1;
      }

      items[index] = updatedItem;
      return { ...prev, items };
    });
  };

  const handleBulkItemChange = (field: keyof InvoiceItem, value: string) => {
    if (field !== "warehouse") return;
    setFormData((prev) => ({
      ...prev,
      warehouse: value,
      items: prev.items.map((item: any) => ({ ...item, warehouse: value })),
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
        const lastEnd = Number((items[items.length - 1] as any)?.boxEnd || 0);
        start = lastEnd ? lastEnd + 1 : 1;
      }
      items.push({
        ...EMPTY_ITEM,
        boxStart: start,
        warehouse: prev.warehouse || "",
      } as any);
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

  const setFormDataFromOrder = (order: any) => {
    isLoadingRef.current = true;

    const mappedTaxesFromCharges =
      Array.isArray(order.charges) && order.charges.length > 0
        ? order.charges.map((ch: any) => ({
            chargeType: ch.chargeType ?? "Actual",
            accountHead: ch.accountHead ?? "",
            description: ch.description ?? "",
            rate: Number(ch.rate) || 0,
            amount: Number(ch.amount) || 0,
          }))
        : Array.isArray(order.taxes) && order.taxes.length > 0
          ? order.taxes.map((t: any) => ({
              chargeType: t.chargeType ?? "",
              accountHead: t.accountHead ?? "",
              description: t.description ?? "",
              rate: Number(t.rate) || 0,
              amount: Number(t.amount) || 0,
            }))
          : [];

    setFormData((prev: any) => ({
      ...prev,
      orderNumber: order.id ?? order.orderNumber,
      customerId: order.customerId ?? prev.customerId,

      taxCategory: order.taxCategory ?? prev.taxCategory,
      status: order.status ?? prev.status,
      docstatus: order.docstatus ?? prev.docstatus,
      deliveryDate: order.deliveryDate,
      customerPoNo: order.customerPoNo ?? "",
      customerPoDate: order.customerPoDate ?? "",

      mode: order.payment_mode ?? prev.mode ?? "",
      payment_mode: order.payment_mode ?? prev.payment_mode ?? "",
      currencyCode: order.currency,
      postingDate: order.postingDate,
      exchangeRt:
        order.exchangeRate && Number(order.exchangeRate) > 0
          ? String(order.exchangeRate)
          : "1",
      destnCountryCd: order.destnCountryCd ?? "",
      warehouse: order.warehouse ?? prev.warehouse ?? "",
      billingAddress:
        order.customerAddressId ?? order.billingAddress ?? prev.billingAddress,
      shippingAddress:
        order.shippingAddressId ??
        order.shippingAddress ??
        prev.shippingAddress,
      paymentInformation: order.paymentInformation ?? prev.paymentInformation,
      taxes: mappedTaxesFromCharges,
      invoiceCharges:
        Array.isArray(order.invoiceCharges) && order.invoiceCharges.length > 0
          ? order.invoiceCharges.map((ch: any) => ({
              charge_type: ch.charge_type ?? "",
              amount: String(ch.amount ?? ""),
            }))
          : [],
      terms: {
        selling: {
          general: order.terms?.selling?.general || "",
          delivery: order.terms?.selling?.delivery || "",
          cancellation: order.terms?.selling?.cancellation || "",
          warranty: order.terms?.selling?.warranty || "",
          liability: order.terms?.selling?.liability || "",
          payment: {
            phases:
              order.terms?.selling?.payment?.phases?.map((p: any) => ({
                id: p.id,
                name: p.name,
                percentage: String(p.percentage),
                condition: p.condition,
                credit_days: String(p.credit_days),
              })) || [],
            dueDates: order.terms?.selling?.payment?.dueDates || "",
            lateCharges: order.terms?.selling?.payment?.lateCharges || "",
            taxes: order.terms?.selling?.payment?.taxes || "",
            notes: order.terms?.selling?.payment?.notes || "",
          },
        },
      },
      items: (order.items || []).map((it: any) => {
        return {
          itemCode: it.itemCode,
          itemName: it.itemName ?? "",
          description: it.description ?? "",
          isServiceItem: it.isServiceItem ?? false,
          quantity: Number(it.quantity),
          price: Number(it.rate),
          discount: Number(it.discount || 0),
          vatRate: it.taxInfo?.[0]?.totalTaxRate ?? 0,
          vatCode:
            it.itemTaxTemplate ?? it.vatCode ?? it.taxInfo?.[0]?.taxName ?? "",
          uom: it.uom ?? "",
          packingUnit: it.packingUnit ?? "",
          packingSize: it.packingSize ?? "",
          batchNo: it.batchNo ?? "",
          boxStart: Number(it.boxStart) || "",
          boxEnd: Number(it.boxEnd) || "",
          warehouse: it.warehouse ?? "",
          deliveryDate: it.deliveryDate ?? "",
          originalQty: Number(it.quantity),
          piecesPerBox: (() => {
            const stored = Number(it.piecesPerBox) || 0;
            if (stored > 0) return stored;
            const boxStart = Number(it.boxStart) || 0;
            const boxEnd = Number(it.boxEnd) || 0;
            const qty = Number(it.quantity) || 0;
            const totalBoxes = boxEnd - boxStart + 1;
            return totalBoxes > 0 ? Math.round(qty / totalBoxes) : 0;
          })(),
          _skipCap: true,
        };
      }),
    }));

    setCustomerDetails({ name: order.customerName, id: order.customerId });
    setCustomerNameDisplay(order.customerName ?? "");
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 0);
  };

  const setTerms = (selling: TermSection) => {
    setFormData((prev) => ({ ...prev, terms: { selling } }));
    markDirty();
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (!checked) shippingEditedRef.current = false;
    markDirty();
  };

  const handleReset = async () => {
    if (initialData) {
      setFormDataFromOrder(initialData);
    } else {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const company = companyRes?.data;
        const today = new Date().toISOString().split("T")[0];
        const paymentTerms = company?.terms?.selling?.payment?.dueDates ?? "";
        const deliveryDate = calculateDueDate(today, paymentTerms);

        setFormData({
          ...DEFAULT_SALES_ORDER_FORM,
          invoiceCharges: [],
          salesTaxTemplate: "",
          postingDate: today,
          deliveryDate,
          exchangeRt: "1",
          warehouse: "",
          terms: { selling: company?.terms?.selling ?? EMPTY_TERMS.selling },
          paymentInformation: {
            ...DEFAULT_SALES_ORDER_FORM.paymentInformation,
            paymentTerms,
            bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
            accountNumber:
              getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
            routingNumber:
              getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
            swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
          },
          shippingAddress: DEFAULT_SALES_ORDER_FORM.billingAddress || "",
        });
      } catch (err) {
        console.error("Failed to re-load company defaults during reset", err);
        showApiError("Failed to reload company defaults");
        setFormData({ ...DEFAULT_SALES_ORDER_FORM });
      }
    }
    shippingEditedRef.current = false;
    lastCurrencyRef.current = baseCurrency;
    lastRateRef.current = 1;
    customerSelectTokenRef.current += 1;

    customerTaxCategoryRef.current = "";
    setCustomerDetails(null);
    setCustomerNameDisplay("");

    setSameAsBilling(true);
    setPage(0);
    setActiveTab("details");
    resetDirty();
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      validateForm();
      const payload = buildSalesOrderPayload(formData, {
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

    formData.items.forEach((item: any) => {
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
      handleCustomerClear,

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
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
  };
};
