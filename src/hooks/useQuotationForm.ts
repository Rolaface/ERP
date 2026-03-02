import { useState, useEffect, useMemo, useRef } from "react";
import { getCustomerByCustomerCode } from "../api/customerApi";
import { getCompanyById } from "../api/companySetupApi";
import type { TermSection } from "../types/termsAndCondition";
import type { Invoice, InvoiceItem } from "../types/invoice";
import { getRolaCountryList } from "../api/lookupApi";
import { getItemByItemCode } from "../api/itemApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import type { QuotationStatus } from "../types/quotation";
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

const getDefaultBank = (accounts: any[] = []) =>
  accounts.find((a) => (a.default === "1" || a.default === 1) && a.bankName?.trim()) ??
  accounts.find((a) => a.bankName?.trim()) ??
  null;
const ITEMS_PER_PAGE = 5;

type NestedSection =
  | "billingAddress"
  | "shippingAddress"
  | "paymentInformation";

export const useQuotationForm = (
  isOpen: boolean,
  onClose: () => void,
  onSubmit?: (data: any) => void,
  initialData?: any,
) => {
  type QuotationFormState = Invoice & {
    quotationStatus: QuotationStatus;
  };

  const [formData, setFormData] = useState<QuotationFormState>({
    ...DEFAULT_INVOICE_FORM,
    invoiceStatus: "Draft",
    invoiceType: "Non-Export",
    quotationStatus: "Draft",
    industryBases: "",
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
  const [itemMaster, setItemMaster] = useState<any[]>([]);
  const [itemMasterLoading, setItemMasterLoading] = useState(false);


  const shippingEditedRef = useRef(false);


  // Initialize form data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      dateOfInvoice: prev.dateOfInvoice || today,
      validUntil: "",
      invoiceStatus: "Draft",
      invoiceType: "Non-Export",
      industryBases: prev.industryBases || "",
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
          paymentTerms: company?.terms?.selling?.payment?.dueDates ?? "",
        bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
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
  industryBases: initialData.industryBases || "",
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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
        paymentTerms: company?.terms?.selling?.payment?.dueDates ?? "",
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
          destnCountryCd:
            invoiceType === "Export" ? countryCode : prev.destnCountryCd,
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
          price: Number(data.sellingPrice) || 0,
          vatRate: Number(data.taxInfo?.taxPerct ?? 0),
          vatCode: data.taxInfo?.taxCode ?? "",
          batchNo: data.batchInfo?.has_batch_no
            ? data.batchInfo?.batchNo || ""
            : "",
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
    setFormData((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        [name]: isNum ? Number(value) : value,
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
      invoiceStatus: "Draft",
      invoiceType: "Non-Export",
      quotationStatus: "Draft",
      industryBases: "",
      shippingAddress: { ...DEFAULT_INVOICE_FORM.billingAddress },

      paymentInformation: {
        paymentTerms: company?.terms?.selling?.payment?.dueDates ?? "",
        paymentMethod: "",
     bankName: getDefaultBank(company?.bankAccounts)?.bankName ?? "",
accountNumber: getDefaultBank(company?.bankAccounts)?.accountNo ?? "",
routingNumber: getDefaultBank(company?.bankAccounts)?.sortCode ?? "",
swiftCode: getDefaultBank(company?.bankAccounts)?.swiftCode ?? "",
      },
    });

    setSameAsBilling(true);
    shippingEditedRef.current = false;
    setPage(0);
    setCustomerNameDisplay("");
    setCustomerDetails(null);

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


      //  VALIDATION
      if (!formData.customerId) {
        throw new Error("Please select a customer");
      }

      if (!formData.industryBases) {
        throw new Error("Please select Industry Base (Product / Service)");
      }

      if (!formData.dateOfInvoice) {
        throw new Error("Please select quotation date");
      }

      if (!formData.dueDate) {
        throw new Error("Please select valid until date");
      }

      if (formData.dueDate < formData.dateOfInvoice) {
        throw new Error("Valid until date cannot be before quotation date");
      }

      if (!formData.paymentInformation?.paymentTerms) {
        throw new Error("Please select payment terms");
      }

      if (formData.items.length === 0 || !formData.items[0].itemCode) {
        throw new Error("Please add at least one item");
      }

      if (hasC1 && !formData.destnCountryCd) {
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
        dateOfQuotation: formData.dateOfInvoice,
        validUntil: formData.dueDate,
        industryBases: formData.industryBases,
        invoiceType: formData.invoiceType,
        quotationStatus: formData.quotationStatus,

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
            batchNo: item.batchNo,
          })),

        terms: formData.terms,
        subTotal,
        totalTax,
        grandTotal,
        documentType: "quotation",
      };

      //  API CALL
      if (onSubmit) {
        await onSubmit(payload);
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
