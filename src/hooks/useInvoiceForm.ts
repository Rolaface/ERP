import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { Invoice, InvoiceItem } from "../types/invoice";
import { getRolaCountryList } from "../api/lookupApi";
import { getItemByItemCode } from "../api/itemApi";
import { getExchangeRate } from "../api/exchangeRateApi";
import {
  showApiError,
  showLoading,
  closeSwal,
} from "../utils/alert";
import {
  DEFAULT_INVOICE_FORM,
  EMPTY_ITEM,
  EMPTY_TERMS,
} from "../constants/invoice.constants";

const ITEMS_PER_PAGE = 5;
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

const getDefaultBank = (accounts: any[] = []) =>
  accounts.find((a) => (a.default === "1" || a.default === 1) && a.bankName?.trim()) ??
  accounts.find((a) => a.bankName?.trim()) ??
  null;
type NestedSection =
  | "billingAddress"
  | "shippingAddress"
  | "paymentInformation";
//---------------------- Utility Function to Calculate Due Date Based on Invoice Date and Terms --//
const calculateDueDate = (invoiceDate: string, terms: string) => {
  if (!invoiceDate) return "";

  const match = terms?.match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;

  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
};

const NUM_FIELDS = ["quantity", "price", "discount", "vatRate", "boxStart", "boxEnd"];

export const useInvoiceForm = (
  isOpen: boolean,
  _onClose: () => void,
  _onSubmit?: (data: any) => void,
  mode?: "invoice" | "proforma" | "edit",
  initialData?: any,
) => {
  const [formData, setFormData] = useState<Invoice>({
    ...DEFAULT_INVOICE_FORM,
    terms: { ...EMPTY_TERMS },
  });

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split("T")[0];

    setFormData(prev => ({
      ...prev,
      dateOfInvoice: prev.dateOfInvoice || today
    }));

  }, [isOpen]);
  useEffect(() => {
    const terms = formData.paymentInformation?.paymentTerms;

    if (!terms || !formData.dateOfInvoice) return;

    const due = calculateDueDate(formData.dateOfInvoice, terms);

    setFormData(prev => ({
      ...prev,
      dueDate: prev.dueDate || due
    }));

  }, [formData.dateOfInvoice, formData.paymentInformation?.paymentTerms]);

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
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);

  const shippingEditedRef = useRef(false);
  const lastCurrencyRef = useRef<string>("INR");
  const lastRateRef = useRef<number>(1);
  const enableExchange = mode === "invoice";

  useEffect(() => {
    if (!isOpen || !initialData) return;

    setFormDataFromInvoice(initialData);

  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen || initialData) return;

    const loadCompanyData = async () => {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const company = companyRes?.data;

        const paymentTerms = company?.terms?.selling?.payment?.dueDates ?? "";

        setFormData((prev) => {
          const dueDate = calculateDueDate(prev.dateOfInvoice, paymentTerms);

          return {
            ...prev,
            invoiceStatus:
              prev.invoiceStatus || (mode === "proforma" ? "Draft" : prev.invoiceStatus),

            invoiceType:
              prev.invoiceType || (mode === "proforma" ? "Non-Export" : prev.invoiceType),

            dueDate: prev.dueDate || dueDate,

            terms: {
              selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
            },

            paymentInformation: {
              ...prev.paymentInformation,
              paymentTerms: paymentTerms,
              bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
              accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
              routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
              swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
            },
          };
        });
      } catch (err: any) {
        console.error("Failed to load company data", err);
        showApiError("Failed to load company configuration");
      }
    };
    loadCompanyData();
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !enableExchange) return;

    const code = String(formData.currencyCode ?? "").trim().toUpperCase();
    if (!code || code === "INR") {
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
        setFormData((prev) => ({ ...prev, exchangeRt: String(rate) }));
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
  }, [isOpen, formData.currencyCode, enableExchange]);

  useEffect(() => {
    if (!isOpen || !enableExchange) return;

    const newCurrency = String(formData.currencyCode ?? "").trim().toUpperCase();
    const prevCurrency = String(lastCurrencyRef.current ?? "").trim().toUpperCase();

    if (!newCurrency || newCurrency === prevCurrency) return;
    if (exchangeRateLoading) return;
    if (exchangeRateError) return;

    const newRate =
      newCurrency === "INR" ? 1 : Number(String(formData.exchangeRt ?? "").trim());
    const prevRate = prevCurrency === "INR" ? 1 : Number(lastRateRef.current);

    if (!Number.isFinite(prevRate) || prevRate <= 0) return;
    if (!Number.isFinite(newRate) || newRate <= 0) return;

    setFormData((prev) => {
      const items = prev.items.map((it) => {
        if (!it?.itemCode) return it;

        const price = Number(it.price);
        if (!Number.isFinite(price)) return it;

        const priceInZmw = prevCurrency === "INR" ? price : price * prevRate;
        const nextPrice = newCurrency === "INR" ? priceInZmw : priceInZmw / newRate;

        return {
          ...it,
          price: Number(nextPrice.toFixed(2)),
        };
      });

      return { ...prev, items };
    });

    lastCurrencyRef.current = newCurrency;
    lastRateRef.current = newRate;
  }, [isOpen, formData.currencyCode, formData.exchangeRt, exchangeRateLoading, exchangeRateError]);

  const setInvoiceFromApi = (invoice: any) => {
    setFormData((prev: any) => ({
      ...prev,
      ...invoice,
      items: invoice.items,
    }));

    setCustomerDetails(invoice.customer);
  };

  const validateForm = (): boolean => {

    const invoiceType = String(formData.invoiceType ?? "").trim().toLowerCase();

    if (!formData.customerId) {
      throw new Error("Please select a customer");
    }

    if (!formData.dueDate) {
      throw new Error("Please select due date");
    }

    if (!formData.items.length) {
      throw new Error("Please add at least one item");
    }


    if (!formData.paymentInformation?.paymentTerms) {
      throw new Error("Please select payment terms");
    }

    formData.items.forEach((it, idx) => {
      if (!it.itemCode) {
        throw new Error(`Item ${idx + 1}: Please select item`);
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


    if (formData.invoiceType === "Export" && !formData.destnCountryCd) {
      throw new Error("Please enter Export To Country");
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
        const digitsOnly = String(value ?? "").replace(/\D/g, "").slice(0, 10);
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

      if (!customerRes || customerRes.status_code !== 200) return;

      const data = customerRes.data;

      const company = companyRes?.data;
      const invoiceType = data.customerTaxCategory as
        | "Export"
        | "Non-Export"
        | "Lpo";

      setTaxCategory(invoiceType);

      const countryLookupList = await getRolaCountryList();

      const formattedCountries = countryLookupList.map((c: any) => ({
        code: c.code || c.name,
        name: c.country_name || c.name,
      }));

      const countryCode = getCountryCode(
        formattedCountries,
        data.shippingCountry || data.billingCountry,
      );

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
        bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
        accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
        routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
        swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
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
          currencyCode: data.currency || prev.currencyCode,
          destnCountryCd: invoiceType === "Export" ? countryCode : prev.destnCountryCd,
          invoiceType,
          billingAddress: billing,
          shippingAddress: shipping,
          paymentInformation,
          terms: {
            selling: company?.terms?.selling ?? prev.terms?.selling ?? EMPTY_TERMS.selling,
          },
        };
      });
    } catch (err: any) {
      console.error("Failed to load customer data", err);
      showApiError("Failed to load customer details");
    }
  };

  const handleItemSelect = async (index: number, itemId: string) => {
    const currentItem = formData.items[index];
    if (enableExchange && exchangeRateLoading) {
      showApiError("Please wait for exchange rate to load...");
      return;
    }
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

        const apiSellingPrice = Number(data.sellingPrice);

        const convertedPrice =
          enableExchange && prev.currencyCode !== "INR"
            ? apiSellingPrice / Number(prev.exchangeRt || 1)
            : apiSellingPrice;


        items[index] = {
          ...items[index],
          itemCode: resolvedId,
          description: data.description ?? data.itemName ?? "",
          price: Number(convertedPrice),

          vatRate: Number(data.taxInfo?.taxPerct ?? 0),
          vatCode: data.taxInfo?.taxCode ?? "",

          quantity: Number(items[index].quantity) || 1,
          discount: Number(items[index].discount) || 0,

          batchNo: data.batchInfo?.has_batch_no
            ? data.batchInfo?.batchNo ?? ""
            : "",
          packingUnit: data.packingUnit ?? "",
          packingSize: data.packingSize ?? "",
          mfgDate: data.batchInfo?.manufacturingDate ?? "",
          expDate: data.batchInfo?.expiryDate ?? "",
        };

        return { ...prev, items };
      });
    } catch (err: any) {
      console.error("Failed to fetch item details", err);
      showApiError("Failed to load item details");
    }
  };

  /* ---------------- ITEMS ---------------- */
  const handleItemChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;


    const isNum = NUM_FIELDS.includes(name);

    setFormData((prev) => {
      const items = [...prev.items];

      let nextValue: any = value;

      if (isNum) {
        if (value === "") {
          nextValue = "";
        } else {
          const parsed = Number(value);
          nextValue = Number.isFinite(parsed) ? parsed : "";
        }
      }

      const updatedItem = {
        ...items[idx],
        [name]: nextValue,
      };

      const start = Number(updatedItem.boxStart || 0);
      const end = Number(updatedItem.boxEnd || 0);

      // sequential validation
      if (idx > 0 && name === "boxStart") {
        const prevEnd = Number(items[idx - 1]?.boxEnd || 0);
        const expected = prevEnd + 1;

        if (prevEnd > 0 && start !== expected) {
          if (start > expected) {
            showApiError(`Row ${idx + 1}: Box must start from ${expected}`);
            return prev;
          }
        }
      }

      items[idx] = updatedItem;
    
      // auto fill next row start
      if (name === "boxEnd" && end >= start && items[idx + 1]) {
        items[idx + 1] = {
          ...items[idx + 1],
          boxStart: end + 1,
        };
      }
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
      const items = [...prev.items];

      let start = 1;

      if (items.length > 0) {
        const lastEnd = Number(items[items.length - 1]?.boxEnd || 0);
        start = lastEnd ? lastEnd + 1 : 1;
      }

      items.push({
        ...EMPTY_ITEM,
        boxStart: start,
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
  const setFormDataFromInvoice = (invoice: any) => {
    setFormData((prev: any) => ({
      ...prev,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType ?? "",
      invoiceStatus: invoice.invoiceStatus ?? "",
      currencyCode: invoice.currencyCode,
      dateOfInvoice: invoice.dateOfInvoice,
      dueDate: invoice.dueDate,
      billingAddress: invoice.billingAddress ?? prev.billingAddress,
      shippingAddress: invoice.shippingAddress ?? prev.shippingAddress,
      paymentInformation:
        invoice.paymentInformation ?? prev.paymentInformation,
      terms: invoice.terms ?? prev.terms,
      items: invoice.items.map((it: any) => {
        const quantity = Number(it.quantity);
        const price = Number(it.price);
        const discount = Number(it.discount || 0);

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
          discount,
          vatRate: taxRate,
          vatCode: it.vatCode ?? "",
          packingUnit: it.packingUnit ?? "",
          packingSize: it.packingSize ?? "",
          _fromInvoice: true,
        };
      }),

    }));

    setCustomerDetails(invoice.customer);
    setCustomerNameDisplay(invoice.customer?.name ?? "");
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
        const dueDate = calculateDueDate(today, paymentTerms);

        setFormData({
          ...DEFAULT_INVOICE_FORM,
          dateOfInvoice: today,
          dueDate: dueDate,
          exchangeRt: "1",

          terms: {
            selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
          },

          paymentInformation: {
            ...DEFAULT_INVOICE_FORM.paymentInformation,
            paymentTerms: paymentTerms,
            bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
            accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
            routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
            swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
          },

          shippingAddress: { ...DEFAULT_INVOICE_FORM.billingAddress },
        });
      } catch (err) {
        console.error("Failed to re-load company defaults during reset", err);
        showApiError("Failed to reload company defaults");
        setFormData({ ...DEFAULT_INVOICE_FORM });
      }
    }

    shippingEditedRef.current = false;
    lastCurrencyRef.current = "INR";
    lastRateRef.current = 1;
    setCustomerDetails(null);
    setCustomerNameDisplay("");
    setTaxCategory("");
    setSameAsBilling(true);
    setPage(0);
    setActiveTab("details");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      validateForm();

      const payload = {
        ...formData,
        subTotal,
        totalTax,
        grandTotal,
        items: formData.items
          .filter((it) => it.itemCode)
          .map((item) => ({
            ...item,
            vatRate: String(item.vatRate),
          })),
      };

      return payload;
    } catch (error: any) {
      showApiError(error?.message || "Validation error");
      return null;
    }
  };

  const { subTotal, totalTax, grandTotal } = useMemo(() => {
    let sub = 0;
    let tax = 0;

    formData.items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 0);
      const vatRate = Number(item.vatRate || 0);

      const lineAmount = qty * price;

      const discountAmount = lineAmount * (discount / 100);

      const netAmount = lineAmount - discountAmount;

      const taxAmount = netAmount * (vatRate / 100);

      sub += netAmount;
      tax += taxAmount;
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
        String(formData.invoiceType ?? "").trim().toLowerCase() === "export",
      isLocal: String(formData.invoiceType ?? "").trim().toLowerCase() === "lpo",
      isNonExport:
        String(formData.invoiceType ?? "").trim().toLowerCase() === "non-export",
      exchangeRateLoading: enableExchange ? exchangeRateLoading : false,
      exchangeRateError: enableExchange ? exchangeRateError : null,
    },
    actions: {
      validateForm,
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
