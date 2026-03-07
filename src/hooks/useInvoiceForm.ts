import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { Invoice, InvoiceItem } from "../types/invoice";
import { getItemByItemCode } from "../api/itemApi";
import { getExchangeRate } from "../api/exchangeRateApi";

import {
  DEFAULT_INVOICE_FORM,
  EMPTY_ITEM,
  EMPTY_TERMS,
} from "../constants/invoice.constants";

const ITEMS_PER_PAGE = 5;
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

type NestedSection =
  | "billingAddress"
  | "shippingAddress"
  | "paymentInformation";

export const useInvoiceForm = (
  isOpen: boolean,
  _onClose: () => void,
  _onSubmit?: (data: any) => void,
  mode?: "invoice" | "proforma",
  initialData?: any,
) => {
  const [formData, setFormData] = useState<Invoice>({
    ...DEFAULT_INVOICE_FORM,
    terms: { ...EMPTY_TERMS },
  });

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
  useEffect(() => {
    if (!isOpen || initialData) return;

    const loadCompanyData = async () => {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const company = companyRes?.data;

        setFormData((prev) => ({
          ...prev,
          terms: {
            selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
          },
          paymentInformation: {
            ...prev.paymentInformation,
            bankName: company?.bankAccounts?.[0]?.bankName ?? "",
            accountNumber: company?.bankAccounts?.[0]?.accountNo ?? "",
            routingNumber: company?.bankAccounts?.[0]?.sortCode ?? "",
            swiftCode: company?.bankAccounts?.[0]?.swiftCode ?? "",
          },
        }));
      } catch (err) {
        console.error("Failed to load company data", err);
      }
    };

    loadCompanyData();
  }, [isOpen, mode]);

  const getCustomerDetailsFromInvoice = (invoice: any) => {
    const direct =
      invoice?.customer ??
      invoice?.customerDetails ??
      invoice?.customer_detail ??
      invoice?.Customer;
    if (direct && typeof direct === "object") return direct;

    const name =
      invoice?.customerName ??
      invoice?.customer_name ??
      invoice?.customer ??
      invoice?.buyerName ??
      invoice?.buyer_name;
    const email =
      invoice?.customerEmail ??
      invoice?.customer_email ??
      invoice?.email ??
      invoice?.buyerEmail ??
      invoice?.buyer_email;
    const mobile_no =
      invoice?.customerPhone ??
      invoice?.customer_phone ??
      invoice?.mobile_no ??
      invoice?.phone ??
      invoice?.buyerPhone ??
      invoice?.buyer_phone;

    if (!name && !email && !mobile_no) return null;

    return {
      name: name ?? "",
      email: email ?? "",
      mobile_no: mobile_no ?? "",
    };
  };

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

  const setInvoiceFromApi = (invoice: any) => {
    const invoiceCurrency = String(invoice?.currencyCode ?? "")
      .trim()
      .toUpperCase();
    const invoiceRate = Number(
      String(invoice?.exchangeRt ?? invoice?.exchangeRate ?? "1").trim(),
    );

    if (invoiceCurrency) {
      lastCurrencyRef.current = invoiceCurrency;
      lastRateRef.current =
        invoiceCurrency === "ZMW"
          ? 1
          : Number.isFinite(invoiceRate) && invoiceRate > 0
            ? invoiceRate
            : 1;
    }

    const mappedItems = Array.isArray(invoice?.items)
      ? invoice.items.map((it: any) => {
          const price = Number(it?.price);
          const rate =
            lastCurrencyRef.current === "ZMW" ? 1 : Number(lastRateRef.current);
          const baseZmw =
            Number.isFinite(price) && Number.isFinite(rate) && rate > 0
              ? lastCurrencyRef.current === "ZMW"
                ? price
                : price * rate
              : undefined;

          return {
            ...it,
            _priceZmw: baseZmw,
          };
        })
      : invoice?.items;

    setFormData((prev: any) => ({
      ...prev,
      ...invoice,
      exchangeRt:
        invoiceCurrency === "ZMW"
          ? "1"
          : String(
              invoice?.exchangeRt ??
                invoice?.exchangeRate ??
                prev.exchangeRt ??
                "",
            ),
      items: mappedItems,
    }));

    const nextCustomer = getCustomerDetailsFromInvoice(invoice);
    setCustomerDetails(nextCustomer);
    setCustomerNameDisplay(String(nextCustomer?.name ?? ""));
  };

  const validateForm = (): boolean => {
    const hasC1 = formData.items.some(
      (it) => String(it?.vatCode ?? "").toUpperCase() === "C1",
    );

    const invoiceType = String(formData.invoiceType ?? "")
      .trim()
      .toLowerCase();

    if (!formData.customerId) {
      throw new Error("Please select a customer");
    }

    if (!formData.dueDate) {
      throw new Error("Please select due date");
    }

    if (!formData.items.length) {
      throw new Error("Please add at least one item");
    }

    formData.items.forEach((it, idx) => {
      if (!it.itemCode) {
        throw new Error(`Item ${idx + 1}: Please select item`);
      }

      if (!formData.paymentInformation?.paymentMethod) {
        throw new Error("Please select payment method");
      }

      if (!it.quantity || it.quantity <= 0) {
        throw new Error(`Item ${idx + 1}: Quantity must be greater than 0`);
      }

      if (!it.price || it.price <= 0) {
        throw new Error(`Item ${idx + 1}: Price must be greater than 0`);
      }
    });

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

    return true;
  };

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

      if (!customerRes || customerRes.status_code !== 200) return;

      const data = customerRes.data;

      const company = companyRes?.data;
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
        paymentTerms:
          company?.terms?.selling?.payment?.dueDates ??
          data.paymentInformation?.paymentTerms ??
          "",

        paymentMethod: "01",
        bankName: company?.bankAccounts?.[0]?.bankName ?? "",
        accountNumber: company?.bankAccounts?.[0]?.accountNo ?? "",
        routingNumber: company?.bankAccounts?.[0]?.sortCode ?? "",
        swiftCode: company?.bankAccounts?.[0]?.swiftCode ?? "",
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
            selling:
              company?.terms?.selling ??
              prev.terms?.selling ??
              EMPTY_TERMS.selling,
          },
        };
      });
    } catch (err) {
      console.error("Failed to load customer data", err);
    }
  };

  const handleItemSelect = async (index: number, itemId: string) => {
    const currentItem = formData.items[index];

    // Invoice-loaded item → do NOT auto override
    if (currentItem?._fromInvoice) {
      setFormData((prev) => {
        const items = [...prev.items];
        items[index] = {
          ...items[index],
          itemCode: itemId,
          _fromInvoice: false, // unlock for user edits
        };
        return { ...prev, items };
      });
      return;
    }

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
          quantity: Number(items[index].quantity) || 1,
          discount: Number(items[index].discount) || 0,
        };

        return { ...prev, items };
      });
    } catch (err) {
      console.error("Failed to fetch item details", err);
    }
  };

  /* ---------------- ITEMS ---------------- */

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
      items[idx] = {
        ...items[idx],
        [name]: isNum ? clampItemNumber(name, value) : value,
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
      return { ...prev, items };
    });
  };
  const setFormDataFromInvoice = async (invoice: any) => {
    const invoiceCurrency = String(invoice?.currencyCode ?? "")
      .trim()
      .toUpperCase();
    const invoiceRate = Number(
      String(invoice?.exchangeRt ?? invoice?.exchangeRate ?? "1").trim(),
    );

    setFormData((prev) => ({
      ...prev,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType ?? "",
      destnCountryCd: invoice.destnCountryCd ?? "",
      currencyCode: invoice.currencyCode,
      dateOfInvoice: invoice.dateOfInvoice,
      dueDate: invoice.dueDate,
      billingAddress: invoice.billingAddress ?? prev.billingAddress,
      shippingAddress: invoice.shippingAddress ?? prev.shippingAddress,
      paymentInformation: invoice.paymentInformation ?? prev.paymentInformation,
      terms: invoice.terms ?? prev.terms,
      items: invoice.items.map((it: any) => {
        const quantity = Number(it.quantity);
        const price = Number(it.price);
        const discount = Number(it.discount || 0);

        const baseZmw =
          invoiceCurrency === "ZMW" ||
          !Number.isFinite(invoiceRate) ||
          invoiceRate <= 0
            ? price
            : price * invoiceRate;

        const discountAmount = quantity * price * (discount / 100);
        const totalInclusive = quantity * price - discountAmount;
        const exclusiveBase = Number(it.vatTaxableAmount || 0);

        const taxAmount = totalInclusive - exclusiveBase;

        const taxRate =
          exclusiveBase > 0
            ? Number(((taxAmount / exclusiveBase) * 100).toFixed(2))
            : 0;

        return {
          itemCode: it.itemCode,
          description: it.description ?? "",
          quantity,
          price,
          _priceZmw: Number.isFinite(baseZmw) ? baseZmw : undefined,
          discount,
          vatRate: taxRate,
          vatCode: it.vatCode ?? "",
          _fromInvoice: true,
        };
      }),
    }));

    const nextCustomer = getCustomerDetailsFromInvoice(invoice);
    setCustomerDetails(nextCustomer);
    setCustomerNameDisplay(String(nextCustomer?.name ?? ""));
  };

  const setTerms = (selling: TermSection) => {
    setFormData((prev) => ({ ...prev, terms: { selling } }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (!checked) shippingEditedRef.current = false;
  };

  const handleReset = async () => {
    try {
      const companyRes = await getCompanyById(COMPANY_ID);
      const company = companyRes?.data;

      const today = new Date().toISOString().slice(0, 10);

      setFormData({
        ...DEFAULT_INVOICE_FORM,
        dateOfInvoice: today,
        terms: {
          selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
        },
        shippingAddress: {
          ...DEFAULT_INVOICE_FORM.billingAddress,
        },
      });
    } catch (err) {
      const today = new Date().toISOString().slice(0, 10);
      setFormData({
        ...DEFAULT_INVOICE_FORM,
        dateOfInvoice: today,
        terms: { ...EMPTY_TERMS },
        shippingAddress: {
          ...DEFAULT_INVOICE_FORM.billingAddress,
        },
      });
    }

    setCustomerDetails(null);
    setCustomerNameDisplay("");
    setTaxCategory("");
    setActiveTab("details");
    setSameAsBilling(true);
    setIsShippingOpen(false);
    setPage(0);
    shippingEditedRef.current = false;
    lastCurrencyRef.current = "ZMW";
    lastRateRef.current = 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    validateForm();

    const resolvedDateOfInvoice =
      String(formData.dateOfInvoice ?? "").trim() ||
      new Date().toISOString().slice(0, 10);

    const payload = {
      ...(formData as any),
      dateOfInvoice: resolvedDateOfInvoice,
      items: formData.items.map((item) => ({
        ...item,
        vatRate: String(item.vatRate), // convert to string only here
      })),
    };

    return payload;
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
      isExport:
        String(formData.invoiceType ?? "")
          .trim()
          .toLowerCase() === "export",
      isLocal:
        String(formData.invoiceType ?? "")
          .trim()
          .toLowerCase() === "lpo",
      isNonExport:
        String(formData.invoiceType ?? "")
          .trim()
          .toLowerCase() === "non-export",
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
      setInvoiceFromApi,
      setFormDataFromInvoice,
    },
  };
};
