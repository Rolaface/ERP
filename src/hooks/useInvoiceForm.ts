import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { Invoice, InvoiceItem } from "../types/invoice";
import { getRolaCountryList } from "../api/lookupApi";
import { getItemByItemCode } from "../api/itemApi";
import { getExchangeRate } from "../api/currencyExchangeApi";
import {
  showApiError,
  showLoading,
  closeSwal,
  showValidationError,
} from "../utils/alert";
import {
  DEFAULT_INVOICE_FORM,
  EMPTY_ITEM,
  EMPTY_TERMS,
} from "../constants/invoice.constants";

const ITEMS_PER_PAGE = 5;
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

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
//---------------------- Utility Function to Calculate Due Date Based on Invoice Date and Terms --//
import dayjs from "dayjs";

const calculateDueDate = (invoiceDate: string, terms: string) => {
  if (!invoiceDate) return "";

  const match = terms?.match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;

  let date = dayjs(invoiceDate, "DD-MMM-YYYY", true);

  if (!date.isValid()) {
    date = dayjs(invoiceDate, "YYYY-MM-DD", true);
  }

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
    invoiceCharges: [],
  });

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      dateOfInvoice: prev.dateOfInvoice || today,
    }));
  }, [isOpen]);

  useEffect(() => {
    const terms = formData.paymentInformation?.paymentTerms;

    if (!terms || !formData.dateOfInvoice) return;

    const due = calculateDueDate(formData.dateOfInvoice, terms);

    setFormData((prev) => ({
      ...prev,
      dueDate: prev.dueDate || due,
    }));
  }, [formData.dateOfInvoice, formData.paymentInformation?.paymentTerms]);

  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNameDisplay, setCustomerNameDisplay] = useState("");
  const [page, setPage] = useState(0);
  const [chargePage, setChargePage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "details" | "address" | "otherCharges" | "terms"
  >("details");
  const [taxCategory, setTaxCategory] = useState<string | undefined>("");
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(
    null,
  );

  const shippingEditedRef = useRef(false);
  const lastCurrencyRef = useRef<string>("");
  const lastRateRef = useRef<number>(1);
  const enableExchange = mode === "invoice";
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData?.invoiceNumber) {
      setFormDataFromInvoice(initialData);
    }
  }, [isOpen, initialData, mode]);
  useEffect(() => {
    if (!isOpen || mode !== "edit") return;

    const loadBaseCurrency = async () => {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const base = companyRes?.data?.financialConfig?.baseCurrency ?? "";
        setBaseCurrency(base);
      } catch (err) {
        console.error("Failed to load base currency", err);
      }
    };

    loadBaseCurrency();
  }, [isOpen, mode]);
  useEffect(() => {
    if (!isOpen || initialData) return;

    const loadCompanyData = async () => {
      try {
        const companyRes = await getCompanyById(COMPANY_ID);
        const company = companyRes?.data;
        const base = company?.financialConfig?.baseCurrency ?? "";
        setBaseCurrency(base);
        setBaseCurrency(base);
        lastCurrencyRef.current = base;

        const paymentTerms = company?.terms?.selling?.payment?.dueDates ?? "";

        setFormData((prev) => {
          const dueDate = calculateDueDate(prev.dateOfInvoice, paymentTerms);

          return {
            ...prev,
            invoiceStatus:
              prev.invoiceStatus ||
              (mode === "proforma" ? "Draft" : prev.invoiceStatus),

            invoiceType:
              prev.invoiceType ||
              (mode === "proforma" ? "Non-Export" : prev.invoiceType),

            dueDate: prev.dueDate || dueDate,

            terms: {
              selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
            },

            paymentInformation: {
              ...prev.paymentInformation,
              paymentTerms: paymentTerms,
              bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
              accountNumber:
                getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
              routingNumber:
                getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
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

    const code = String(formData.currencyCode ?? "")
      .trim()
      .toUpperCase();
    const base = baseCurrency.trim().toUpperCase();
    if (!code || !base || code === base) {
      setExchangeRateLoading(false);
      setExchangeRateError(null);

      if (mode !== "edit") {
        setFormData((prev) => ({ ...prev, exchangeRt: "1" }));
      }

      return;
    }
    let cancelled = false;
    setExchangeRateLoading(true);
    setFormData((prev) => ({
      ...prev,
      exchangeRt: "1",
    }));
    setExchangeRateError(null);

    getExchangeRate({
      from_currency: code,
      to_currency: baseCurrency,
      transaction_date: formData.dateOfInvoice,
      args: "for_selling",
    })
      .then((res) => {
        const rate = Number(res?.message);

        setFormData((prev) => ({
          ...prev,
          exchangeRt: Number.isFinite(rate) && rate > 0 ? String(rate) : "1",
        }));
      })
      .catch((err) => {
        if (cancelled) return;

        setExchangeRateError(err?.message || "Exchange rate not found");

        setFormData((prev) => ({
          ...prev,
          exchangeRt: "1",
        }));
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

  const setInvoiceFromApi = (invoice: any) => {
    setFormData((prev: any) => ({
      ...prev,
      ...invoice,
      items: invoice.items,
    }));

    setCustomerDetails(invoice.customer);
  };

  const validateForm = (): boolean => {
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

    if (!formData.paymentInformation?.paymentTerms) {
      throw new Error("Please select payment terms");
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
      if (it.qty !== undefined && Number(it.quantity) > Number(it.qty)) {
        setPage(Math.floor(idx / ITEMS_PER_PAGE));
        throw new Error(
          `Item ${idx + 1}: Quantity (${it.quantity}) exceeds available stock (${it.qty}) for batch ${it.batchNo || "N/A"}`,
        );
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

    if (name === "updateStock") {
      setFormData((prev) => ({
        ...prev,
        updateStock: e.target.checked,
      }));
      return;
    }

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
   const invoiceType = data?.customerTaxCategory || "";
setTaxCategory(invoiceType);

      const countryLookupList = await getRolaCountryList();

      const formattedCountries = countryLookupList.map((c: any) => ({
        code: c.code || c.name,
        name: c.country_name || c.name,
      }));


      setCustomerDetails(data);
     setCustomerDetails({ ...data });
     const billingAddressObj = data.addresses?.find(
  (addr: any) => addr.type === "Billing"
);

const shippingAddressObj = data.addresses?.find(
  (addr: any) => addr.type === "Shipping"
);

const billing = {
  line1: billingAddressObj?.line1 ?? "",
  line2: billingAddressObj?.line2 ?? "",
  postalCode: billingAddressObj?.postalCode ?? "",
  city: billingAddressObj?.city ?? "",
  state: billingAddressObj?.state ?? "",
  country: billingAddressObj?.country ?? "",
};

const shippingFromCustomer = {
  line1: shippingAddressObj?.line1 ?? "",
  line2: shippingAddressObj?.line2 ?? "",
  postalCode: shippingAddressObj?.postalCode ?? "",
  city: shippingAddressObj?.city ?? "",
  state: shippingAddressObj?.state ?? "",
  country: shippingAddressObj?.country ?? "",
};

      const countryCode = getCountryCode(
  formattedCountries,
  shippingAddressObj?.country || billingAddressObj?.country
);


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
    let shipping = shippingFromCustomer;

if (sameAsBilling) {
  shipping = { ...billing };
} else if (shippingEditedRef.current) {
  shipping = prev.shippingAddress;
}

        return {
          ...prev,
          currencyCode: data.currency || prev.currencyCode,
          destnCountryCd:
            invoiceType === "Export" ? countryCode : prev.destnCountryCd,
          invoiceType,
          billingAddress: billing,
          shippingAddress: shipping,
          paymentInformation,
          terms: {
  selling:
    data?.terms?.Selling ??
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

  const handleItemSelect = async (index: number, itemId: string) => {
    const currentItem = formData.items[index];
    if (enableExchange && exchangeRateLoading) {
      showValidationError("Please wait for exchange rate to load...");
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

        const base = baseCurrency.trim().toUpperCase();
        const convertedPrice =
          enableExchange && prev.currencyCode?.trim().toUpperCase() !== base
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
            ? (data.batchInfo?.batchNo ?? "")
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
            showValidationError(
              `Row ${idx + 1}: Box must start from ${expected}`,
            );
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
  const handleBulkItemChange = (field: keyof InvoiceItem, value: string) => {
    if (field !== "warehouse") return;

    setFormData((prev) => ({
      ...prev,
      warehouse: value,
      items: prev.items.map((item) => ({
        ...item,
        warehouse: value,
      })),
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

  // ✅ REMOVE OTHER CHARGE
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

  // ✅ DUPLICATE ITEM — inserts an exact copy right below the source row
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
    setFormData((prev: any) => ({
      ...prev,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId ?? prev.customerId,
      invoiceType: invoice.invoiceType ?? "",
      invoiceStatus: invoice.invoiceStatus ?? "",
      currencyCode: invoice.currencyCode,
      dateOfInvoice: invoice.dateOfInvoice,
      exchangeRt:
        invoice.exchangeRt && Number(invoice.exchangeRt) > 0
          ? String(invoice.exchangeRt)
          : "1",
      dueDate: invoice.dueDate,
      destnCountryCd: invoice.destnCountryCd ?? "",
      billingAddress: invoice.billingAddress ?? prev.billingAddress,
      shippingAddress: invoice.shippingAddress ?? prev.shippingAddress,
      paymentInformation: invoice.paymentInformation ?? prev.paymentInformation,
      invoiceCharges:
        Array.isArray(invoice.invoiceCharges) &&
        invoice.invoiceCharges.length > 0
          ? invoice.invoiceCharges.map((ch: any) => ({
              charge_type: ch.charge_type ?? "",
              amount: String(ch.amount ?? ""),
            }))
          : [],
      terms: invoice.terms ?? prev.terms,
      items: (invoice.items || []).map((it: any) => {
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
          batchNo: it.batchNo ?? "",
          boxStart: Number(it.boxStart) || "",
          boxEnd: Number(it.boxEnd) || "",
          mfgDate: it.mfgDate ?? "",
          expDate: it.expDate ?? "",
          warehouse: it.warehouse ?? "",
        };
      }),
    }));

    setCustomerDetails({
      name: invoice.customerName,
      id: invoice.customerId,
    });

    setCustomerNameDisplay(invoice.customerName ?? "");
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
          invoiceCharges: [],

          dateOfInvoice: today,
          dueDate: dueDate,
          exchangeRt: "1",
          warehouse: "",
          updateStock: true,

          terms: {
            selling: company?.terms?.selling ?? EMPTY_TERMS.selling,
          },

          paymentInformation: {
            ...DEFAULT_INVOICE_FORM.paymentInformation,
            paymentTerms: paymentTerms,
            bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
            accountNumber:
              getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
            routingNumber:
              getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
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
    lastCurrencyRef.current = baseCurrency;
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
        invoiceCharges: (formData.invoiceCharges || []).filter(
          (ch) =>
            ch.charge_type?.trim() && String(ch.amount ?? "").trim() !== "",
        ),
        exchangeRt:
          Number(formData.exchangeRt) > 0 ? String(formData.exchangeRt) : "1",
        subTotal,
        totalTax,

        items: formData.items
          .filter((it) => it.itemCode)
          .map((item) => ({
            ...item,
            vatRate: String(item.vatRate),
          })),
      };

      return payload;
    } catch (error: any) {
      showValidationError(error?.message || "Validation error");
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
      chargePage,
      setChargePage,
      baseCurrency,

      chargeCount: formData.invoiceCharges.length,
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
      duplicateItem,
      setTerms,
      handleSameAsBillingChange,
      handleReset,
      handleSubmit,
      setInvoiceFromApi,
      setFormDataFromInvoice,
      handleBulkItemChange,
      addOtherCharge,
      handleOtherChargeChange,
      removeOtherCharge,
    },
  };
};