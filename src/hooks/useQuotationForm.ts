import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { Invoice, InvoiceItem } from "../types/invoice";
import { getItemByItemCode } from "../api/itemApi";
import { getExchangeRate } from "../api/exchangeRateApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

import {
  DEFAULT_INVOICE_FORM,
  EMPTY_ITEM,
} from "../constants/invoice.constants";
import {
  showApiError,
  showLoading,
  showSuccess,
  closeSwal,
} from "../utils/alert";

const ITEMS_PER_PAGE = 5;

type NestedSection =
  | "billingAddress"
  | "shippingAddress"
  | "paymentInformation";

export const useQuotationForm = (
  isOpen: boolean,
  onClose: () => void,
  onSubmit?: (data: any) => void | Promise<unknown>,
  initialData?: any,
) => {
  const [formData, setFormData] = useState<Invoice>({
    ...DEFAULT_INVOICE_FORM,
  });
  const companyLoadedRef = useRef(false);
  const [companyData, setCompanyData] = useState<any>(null);

  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNameDisplay, setCustomerNameDisplay] = useState("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "terms" | "address">(
    "details",
  );
  const [taxCategory, setTaxCategory] = useState<string | undefined>("");
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(
    null,
  );

  const shippingEditedRef = useRef(false);
  const lastCurrencyRef = useRef<string>("ZMW");
  const lastRateRef = useRef<number>(1);

  // Initialize form data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      dateOfInvoice: prev.dateOfInvoice || today,
      validUntil: "",
    }));

    setPage(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || companyLoadedRef.current) return;

    companyLoadedRef.current = true;

    getCompanyById(COMPANY_ID).then((res) => {
      const company = res?.data;
      setCompanyData(company); // store it

      setFormData((prev) => ({
        ...prev,
        paymentInformation: {
          ...prev.paymentInformation,
          bankName: company?.bankAccounts?.[0]?.bankName ?? "",
          accountNumber: company?.bankAccounts?.[0]?.accountNo ?? "",
          routingNumber: company?.bankAccounts?.[0]?.sortCode ?? "",
          swiftCode: company?.bankAccounts?.[0]?.swiftCode ?? "",
        },
      }));
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      companyLoadedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const code = String(formData.currencyCode ?? "")
      .trim()
      .toUpperCase();
    if (!code) {
      setExchangeRateLoading(false);
      setExchangeRateError(null);
      setFormData((prev) => ({ ...prev, exchangeRt: "" }));
      return;
    }

    if (code === "ZMW") {
      setExchangeRateLoading(false);
      setExchangeRateError(null);
      setFormData((prev) => ({ ...prev, exchangeRt: "1" }));
      return;
    }

    let cancelled = false;
    setExchangeRateLoading(true);
    setExchangeRateError(null);

    getExchangeRate(code)
      .then((res) => {
        if (cancelled) return;
        const rate = Number(res?.exchange_rate);
        if (!Number.isFinite(rate) || rate <= 0) {
          setExchangeRateError("Invalid exchange rate");
          return;
        }
        setFormData((prev) => ({
          ...prev,
          exchangeRt: String(Number(rate.toFixed(2))),
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setExchangeRateError("Failed to load exchange rate");
      })
      .finally(() => {
        if (cancelled) return;
        setExchangeRateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.currencyCode]);

  useEffect(() => {
    if (!isOpen) return;

    const newCurrency = String(formData.currencyCode ?? "")
      .trim()
      .toUpperCase();
    const prevCurrency = String(lastCurrencyRef.current ?? "")
      .trim()
      .toUpperCase();

    if (!newCurrency || newCurrency === prevCurrency) return;
    if (exchangeRateLoading) return;
    if (exchangeRateError) return;

    const newRate =
      newCurrency === "ZMW"
        ? 1
        : Number(String(formData.exchangeRt ?? "").trim());
    const prevRate = prevCurrency === "ZMW" ? 1 : Number(lastRateRef.current);

    if (!Number.isFinite(prevRate) || prevRate <= 0) return;
    if (!Number.isFinite(newRate) || newRate <= 0) return;

    setFormData((prev) => {
      const items = prev.items.map((it) => {
        if (!it?.itemCode) return it;

        const price = Number(it.price);
        if (!Number.isFinite(price)) return it;

        const baseZmw = Number.isFinite(Number((it as any)._priceZmw))
          ? Number((it as any)._priceZmw)
          : prevCurrency === "ZMW"
            ? price
            : price * prevRate;

        const nextPrice = newCurrency === "ZMW" ? baseZmw : baseZmw / newRate;

        return {
          ...it,
          price: Number(nextPrice.toFixed(2)),
          _priceZmw: baseZmw,
        };
      });

      return { ...prev, items };
    });

    lastCurrencyRef.current = newCurrency;
    lastRateRef.current = newRate;
  }, [
    isOpen,
    formData.currencyCode,
    formData.exchangeRt,
    exchangeRateLoading,
    exchangeRateError,
  ]);
  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(formData.items.length / ITEMS_PER_PAGE) - 1,
    );

    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [formData.items.length, page]);

  useEffect(() => {
    if (!isOpen || !initialData) return;

    setSameAsBilling(false);
    shippingEditedRef.current = true;

    setFormData({
      ...DEFAULT_INVOICE_FORM,
      ...initialData,
      dateOfInvoice: initialData.dateOfQuotation,
      dueDate: initialData.validUntil,
      items: (initialData.items || []).map((it: any) => ({
        itemCode: it.itemCode,
        description: it.description ?? "",
        quantity: Number(it.quantity),
        price: Number(it.price),
        discount: Number(it.discount),
        vatRate: Number(it.vatRate || 0),
        vatCode: it.vatCode ?? "",
      })),
    });

    setCustomerDetails(initialData.customer);
    setCustomerNameDisplay(initialData.customer?.name ?? "");
  }, [isOpen, initialData]);

  // Sync shipping address with billing if sameAsBilling is true
  useEffect(() => {
    if (!sameAsBilling) return;
    setFormData((prev) => ({
      ...prev,
      shippingAddress: { ...prev.billingAddress },
    }));
  }, [formData.billingAddress, sameAsBilling]);

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
        [section]: {
          ...(prev[section] as object),
          [name]: value,
        },
      }));

      if (section === "shippingAddress" && !sameAsBilling) {
        shippingEditedRef.current = true;
      }
    } else {
      if (name === "invoiceType") {
        const nextType = String(value ?? "").trim();
        setFormData((prev) => ({
          ...prev,
          [name]: nextType,
          destnCountryCd: nextType === "Export" ? "" : prev.destnCountryCd,
        }));
        return;
      }

      if (name === "currencyCode") {
        const next = String(value ?? "")
          .trim()
          .toUpperCase();
        setExchangeRateError(null);
        setExchangeRateLoading(!!next && next !== "ZMW");
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          exchangeRt: next === "ZMW" ? "1" : "",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      const customerRes = await getCustomerByCustomerCode(id);
      const company = companyData;
      if (!company) return;

      if (!customerRes || customerRes.status_code !== 200) return;

      const data = customerRes.data;

      const invoiceType = data.customerTaxCategory as
        | "Export"
        | "Non-Export"
        | "Lpo";

      setTaxCategory(invoiceType);

      setCustomerDetails(data);

      const billing = {
        line1: data.billingAddressLine1 ?? "",
        line2: data.billingAddressLine2 ?? "",
        postalCode: data.billingPostalCode ?? "",
        city: data.billingCity ?? "",
        state: data.billingState ?? "",
        country: data.billingCountry ?? "",
      };

      const shippingFromCustomer = {
        line1: data.shippingAddressLine1 ?? "",
        line2: data.shippingAddressLine2 ?? "",
        postalCode: data.shippingPostalCode ?? "",
        city: data.shippingCity ?? "",
        state: data.shippingState ?? "",
        country: data.shippingCountry ?? "",
      };

      const paymentInformation = {
        paymentTerms: company?.terms?.selling?.payment?.dueDates ?? "",
        paymentMethod: "01",
        bankName: company?.bankAccounts?.[0]?.bankName ?? "",
        accountNumber: company?.bankAccounts?.[0]?.accountNo ?? "",
        routingNumber: company?.bankAccounts?.[0]?.sortCode ?? "",
        swiftCode: company?.bankAccounts?.[0]?.swiftCode ?? "ccccv",
      };

      setFormData((prev) => {
        let shipping = prev.shippingAddress;

        if (sameAsBilling) {
          shipping = { ...billing };
        } else if (!shippingEditedRef.current) {
          shipping = shippingFromCustomer;
        }

        return {
          ...prev,
          destnCountryCd: invoiceType === "Export" ? "" : prev.destnCountryCd,
          invoiceType,
          billingAddress: billing,
          shippingAddress: shipping,
          paymentInformation,
          terms: {
            selling: company?.terms?.selling ??
              data?.terms?.selling ?? { payment: { phases: [] } },
          },
        };
      });
    } catch (err) {
      console.error("Failed to load customer data", err);
    }
  };

  const handleItemSelect = async (index: number, itemId: string) => {
    try {
      const res = await getItemByItemCode(itemId);
      if (!res || res.status_code !== 200) return;

      const data = res.data;
      setFormData((prev) => {
        const items = [...prev.items];

        const resolvedId = String(data?.id ?? itemId).trim();
        const currentCode = String(items[index]?.itemCode ?? "").trim();
        if (currentCode && currentCode === resolvedId) {
          return prev;
        }

        const currency = String(prev.currencyCode ?? "")
          .trim()
          .toUpperCase();
        const rate = Number(String(prev.exchangeRt ?? "1").trim());
        const apiSellingPrice = Number(data.sellingPrice);
        const hasApiPrice =
          Number.isFinite(apiSellingPrice) && apiSellingPrice > 0;
        const baseZmw = hasApiPrice
          ? apiSellingPrice
          : Number(items[index].price);
        const convertedPrice = (() => {
          if (!Number.isFinite(baseZmw)) return Number(items[index].price);
          if (currency !== "ZMW" && Number.isFinite(rate) && rate > 0)
            return baseZmw / rate;
          return baseZmw;
        })();

        const existingIdx = items.findIndex(
          (it, i) =>
            i !== index && String(it?.itemCode ?? "").trim() === resolvedId,
        );

        if (existingIdx !== -1) {
          const currentQty = Number(items[existingIdx]?.quantity) || 0;
          items[existingIdx] = {
            ...items[existingIdx],
            quantity: currentQty + 1,
          };

          items[index] = { ...EMPTY_ITEM };
          return { ...prev, items };
        }

        items[index] = {
          ...items[index],
          itemCode: resolvedId,
          description: data.itemDescription ?? data.itemName ?? "",
          price: Number(Number(convertedPrice).toFixed(2)),
          _priceZmw: Number.isFinite(baseZmw) ? baseZmw : undefined,
          vatRate: Number(data.taxPerct ?? 0),
          vatCode: prev.invoiceType === "Export" ? "C1" : (data.taxCode ?? ""),
        };

        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
    }
  };

  const handleItemChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    const isNum = ["quantity", "price", "discount", "vatRate"].includes(name);

    const clampItemNumber = (field: string, raw: string) => {
      const n = Number(raw);
      if (Number.isNaN(n)) return 0;

      if (field === "quantity") return Math.max(1, n);
      if (field === "price") return Math.max(0, n);
      if (field === "discount") return Math.min(100, Math.max(0, n));
      if (field === "vatRate") return Math.max(0, n);
      return n;
    };

    setFormData((prev) => {
      const items = [...prev.items];
      const nextVal = isNum ? clampItemNumber(name, value) : value;

      if (name === "price") {
        const currency = String(prev.currencyCode ?? "")
          .trim()
          .toUpperCase();
        const rate = Number(String(prev.exchangeRt ?? "1").trim());
        const baseZmw =
          currency === "ZMW" || !Number.isFinite(rate) || rate <= 0
            ? Number(nextVal)
            : Number(nextVal) * rate;

        items[idx] = {
          ...items[idx],
          price: Number(nextVal),
          _priceZmw: Number.isFinite(baseZmw) ? baseZmw : items[idx]?._priceZmw,
        };

        return { ...prev, items };
      }

      items[idx] = {
        ...items[idx],
        [name]: nextVal,
      };
      return { ...prev, items };
    });
  };

  const updateItemDirectly = (index: number, updated: Partial<InvoiceItem>) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...updated };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => {
      const items = [...prev.items, { ...EMPTY_ITEM }];
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

  const setTerms = (selling: TermSection) => {
    setFormData((prev) => ({ ...prev, terms: { selling } }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (!checked) shippingEditedRef.current = false;
  };

  const handleReset = () => {
    if (!companyData) return;

    const company = companyData;

    setFormData({
      ...DEFAULT_INVOICE_FORM,
      invoiceType: "Non-Export",
      shippingAddress: { ...DEFAULT_INVOICE_FORM.billingAddress },
      paymentInformation: {
        paymentTerms: company?.terms?.selling?.payment?.dueDates ?? "",
        paymentMethod: "",
        bankName: company?.bankAccounts?.[0]?.bankName ?? "",
        accountNumber: company?.bankAccounts?.[0]?.accountNo ?? "",
        routingNumber: company?.bankAccounts?.[0]?.sortCode ?? "",
        swiftCode: company?.bankAccounts?.[0]?.swiftCode ?? "",
      },
    });

    setSameAsBilling(true);
    shippingEditedRef.current = false;
    setPage(0);
    setCustomerNameDisplay("");
    setCustomerDetails(null);
    lastCurrencyRef.current = "ZMW";
    lastRateRef.current = 1;
  };

  const { subTotal, totalTax, grandTotal } = useMemo(() => {
    let sub = 0;
    let tax = 0;

    formData.items.forEach((item) => {
      const discountAmount =
        item.quantity * item.price * (Number(item.discount || 0) / 100);
      const totalInclusive = item.quantity * item.price - discountAmount;
      const exclusive = totalInclusive / (1 + Number(item.vatRate || 0) / 100);
      const taxAmt = totalInclusive - exclusive;

      sub += exclusive;
      tax += taxAmt;
    });

    return {
      subTotal: sub,
      totalTax: tax,
      grandTotal: sub + tax,
    };
  }, [formData.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const hasC1 = formData.items.some(
        (it) => String(it?.vatCode ?? "").toUpperCase() === "C1",
      );

      const quotationDate =
        formData.dateOfInvoice || new Date().toISOString().slice(0, 10);

      //  VALIDATION
      if (!formData.customerId) {
        throw new Error("Please select a customer");
      }

      if (!formData.dueDate) {
        throw new Error("Please select valid until date");
      }

      if (formData.dueDate < quotationDate) {
        throw new Error("Valid until date cannot be before quotation date");
      }

      if (!formData.paymentInformation?.paymentMethod) {
        throw new Error("Please select payment method");
      }

      if (formData.items.length === 0 || !formData.items[0].itemCode) {
        throw new Error("Please add at least one item");
      }

      const invoiceType = String(formData.invoiceType ?? "")
        .trim()
        .toLowerCase();

      if (invoiceType === "lpo") {
        const lpoNumber = String(formData.lpoNumber ?? "").trim();
        if (!/^\d{10}$/.test(lpoNumber)) {
          throw new Error("LPO Number must be exactly 10 digits");
        }
      }

      if ((invoiceType === "export" || hasC1) && !formData.destnCountryCd) {
        throw new Error(
          "Destination country (destnCountryCd) is required for VAT code C1 transactions",
        );
      }

      //  LOADING
      showLoading("Saving quotation...");

      //  PAYLOAD
      const payload = {
        customerId: formData.customerId,
        currencyCode: formData.currencyCode,
        exchangeRt: String(formData.exchangeRt ?? "1"),
        dateOfQuotation: quotationDate,
        validUntil: formData.dueDate,
        industryBases: formData.industryBases || "Service",
        invoiceType: formData.invoiceType,

        ...((formData.invoiceType === "Export" || hasC1) && {
          destnCountryCd: formData.destnCountryCd,
        }),

        ...(formData.invoiceType === "Lpo" && {
          lpoNumber: formData.lpoNumber,
        }),

        billingAddress: formData.billingAddress,
        shippingAddress: formData.shippingAddress,
        paymentInformation: formData.paymentInformation,

        items: formData.items
          .filter((item) => item.itemCode) // Only include items with itemCode
          .map((item) => ({
            itemCode: item.itemCode,
            quantity: item.quantity,
            description: item.description,
            discount: item.discount,
            vatRate: item.vatRate.toString(),
            price: item.price,
            vatCode: item.vatCode,
          })),

        terms: formData.terms,
        subTotal,
        totalTax,
        grandTotal,
        documentType: "quotation",
      };

      //  API CALL
      if (onSubmit) {
        await Promise.resolve(onSubmit(payload));
      } else {
        throw new Error(
          "No onSubmit handler provided. Please check QuotationModal usage.",
        );
      }

      //  SUCCESS
      closeSwal();

      showSuccess("Quotation saved successfully");

      onClose?.();
    } catch (error: any) {
      closeSwal();
      showApiError(error);
    }
  };

  const paginatedItems = formData.items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals: { subTotal, totalTax, grandTotal },
    ui: {
      page,
      setPage,
      activeTab,
      setActiveTab,
      taxCategory,
      setTaxCategory,
      isShippingOpen,
      setIsShippingOpen,
      sameAsBilling,
      itemCount: formData.items.length,
      isExport: formData.invoiceType === "Export",
      isLocal: formData.invoiceType === "Lpo",
      isNonExport: formData.invoiceType === "Non-Export",
      exchangeRateLoading,
      exchangeRateError,
      hasC1: formData.items.some(
        (it) => String(it?.vatCode ?? "").toUpperCase() === "C1",
      ),
    },
    actions: {
      handleInputChange,
      handleCustomerSelect,
      handleItemSelect,
      handleItemChange,
      updateItemDirectly,
      addItem,
      removeItem,
      setTerms,
      handleSameAsBillingChange,
      handleReset,
      handleSubmit,
    },
  };
};
