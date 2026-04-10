import { useState, useEffect } from "react";
import type { SupplierFormData, SupplierTab } from "../types/Supply/supplier";
import { emptySupplierForm } from "../types/Supply/supplier";
import { createSupplier, updateSupplier } from "../api/procurement/supplierApi";
import { mapSupplierToApi } from "../types/Supply/supplierMapper";
import { Supplier } from "../types/Supply/supplier";
import { mapSupplierToForm } from "../types/Supply/supplierMapper";
import { showApiError, showSuccess, showValidationError } from "../utils/alert";
import { generateSupplierCode } from "../types/Supply/generateSupplierCode";
import { getCompanyById } from "../api/companySetupApi";
const companyId = import.meta.env.VITE_COMPANY_ID;
import type { TermSection } from "../types/termsAndCondition";
import { createNewBankAccount } from "../api/BankAccountApi";

interface UseSupplierFormProps {
  initialData?: Supplier | null;
  isEditMode?: boolean;
  onSuccess?: (data: SupplierFormData) => void;
  isOpen?: boolean;
  existingSupplierCodes?: string[];
}

interface SupplierErrors {
  // Supplier tab
  tpin?: string;
  supplierName?: string;
  taxCategory?: string;
  contactPerson?: string;
  phoneNo?: string;
  emailId?: string;
  // Payment tab
  currency?: string;
  paymentTerms?: string;
  dateOfAddition?: string;
  openingBalance?: string;
  bankAccount?: string;
  // Address tab
  billingAddressLine1?: string;
  billingCity?: string;
  billingCountry?: string;
  district?: string;
  province?: string;
  billingPostalCode?: string;
}

export const useSupplierForm = ({
  initialData,
  isEditMode = false,
  onSuccess,
  isOpen,
  existingSupplierCodes = [],
}: UseSupplierFormProps) => {
  const [form, setForm] = useState<SupplierFormData>(emptySupplierForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SupplierTab>("supplier");
  const [errors, setErrors] = useState<SupplierErrors>({});
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [isCodeEdited, setIsCodeEdited] = useState(false);
  const [companyBuyingTerms, setCompanyBuyingTerms] =
    useState<TermSection | null>(null);

  useEffect(() => {
    if (!isOpen || !companyId || isEditMode) return;

    const loadCompanyTerms = async () => {
      try {
        const res = await getCompanyById(companyId);

        const buyingTerms = res?.data?.terms?.buying;

        if (!buyingTerms) return;

        setCompanyBuyingTerms(buyingTerms);

        setForm((prev) => ({
          ...prev,
          terms: {
            ...prev.terms,
            buying: buyingTerms,
          },
        }));
      } catch (err) {
        console.error("Failed to load buying terms", err);
      }
    };

    loadCompanyTerms();
  }, [companyId, isOpen, isEditMode]);

  const handleTermsChange = (type: "buying", updated: TermSection) => {
    setForm((prev) => ({
      ...prev,
      terms: {
        ...prev.terms,
        [type]: updated,
      },
    }));
  };

  // Validate Supplier Tab
  const validateSupplierTab = (): boolean => {
    const newErrors: SupplierErrors = {};

    if (!form.tpin || form.tpin.trim() === "") {
      newErrors.tpin = "TPIN is required";
    }

    if (!form.supplierName || form.supplierName.trim() === "") {
      newErrors.supplierName = "Supplier Name is required";
    }

    if (!form.taxCategory) {
      newErrors.taxCategory = "Tax Category is required";
    }

    if (!form.contactPerson || form.contactPerson.trim() === "") {
      newErrors.contactPerson = "Contact Person is required";
    }

    if (!form.phoneCode || !form.phoneNo) {
      newErrors.phoneNo = "Phone Number is required";
    }

    if (!form.emailId) {
      newErrors.emailId = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId)) {
      newErrors.emailId = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Payment Tab
  const validatePaymentTab = (): boolean => {
    const newErrors: SupplierErrors = {};

    if (!form.currency) {
      newErrors.currency = "Currency is required";
    }

    if (!form.paymentTerms) {
      newErrors.paymentTerms = "Credit days is required";
    }


    if (form.openingBalance === null || form.openingBalance === undefined) {
      newErrors.openingBalance = "Opening Balance is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Address Tab
  const validateAddressTab = (): boolean => {
    const newErrors: SupplierErrors = {};

    if (!form.billingAddressLine1 || form.billingAddressLine1.trim() === "") {
      newErrors.billingAddressLine1 = "Address Line 1 is required";
    }

    if (!form.billingCity || form.billingCity.trim() === "") {
      newErrors.billingCity = "City is required";
    }

    if (!form.billingCountry || form.billingCountry.trim() === "") {
      newErrors.billingCountry = "Country is required";
    }

    if (!form.district || form.district.trim() === "") {
      newErrors.district = "District is required";
    }

    if (!form.province || form.province.trim() === "") {
      newErrors.province = "Province is required";
    }

    if (!form.billingPostalCode || form.billingPostalCode.trim() === "") {
      newErrors.billingPostalCode = "Postal Code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prefill Edit Data
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const mapped = mapSupplierToForm(initialData);

      const legacyAccount = mapped as any;

      if (!mapped.bankAccounts || mapped.bankAccounts.length === 0) {
        mapped.bankAccounts = [
          {
            id: crypto.randomUUID(),
            bankName: legacyAccount.bankAccount || "",
            accountNumber: legacyAccount.accountNumber || "",
            accountHolder: legacyAccount.accountHolder || "",
            sortCode: legacyAccount.sortCode || "",
            swiftCode: legacyAccount.swiftCode || "",
            branchAddress: legacyAccount.branchAddress || "",
            isDefault: true,
          },
        ];
      }

      setForm((prev) => ({
        ...mapped,
        terms: {
          buying: mapped.terms?.buying?.payment?.phases?.length
            ? mapped.terms.buying
            : prev.terms?.buying || emptySupplierForm.terms?.buying,
        },
      }));

      setIsCodeEdited(true);
    } else {
      setForm({
        ...emptySupplierForm,
        dateOfAddition: new Date().toISOString().split("T")[0],
        bankAccounts: [],
      });
      setIsCodeEdited(false);
    }

    setActiveTab("supplier");
    setErrors({});
    setAllowSubmit(false);
  }, [initialData, isOpen]);

  // Input Change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;

    if (name === "bankAccounts") {
      setForm((p) => ({
        ...p,
        bankAccounts: value as any,
      }));
      return;
    }

    // Clear error for this field
    if (errors[name as keyof SupplierErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((p) => ({ ...p, [name]: checked as any }));
    } else {
      // Only email validation remains
      if (name === "emailId") {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setErrors((prev) => ({
            ...prev,
            emailId: "Invalid email format",
          }));
        }
      }

      if (name === "supplierName") {
        setForm((prev) => {
          // If user already edited code → don't override
          if (isCodeEdited) {
            return { ...prev, supplierName: value };
          }

          const autoCode = generateSupplierCode(value, existingSupplierCodes);
          return {
            ...prev,
            supplierName: value,
            supplierCode: autoCode,
          };
        });

        return;
      }

      if (name === "supplierCode") {
        setIsCodeEdited(true);

        setForm((prev) => ({
          ...prev,
          supplierCode: value.toUpperCase(),
        }));

        return;
      }

      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Validate all tabs before submission
    const supplierValid = validateSupplierTab();
    const paymentValid = validatePaymentTab();
    const addressValid = validateAddressTab();

    if (!supplierValid) {
      setActiveTab("supplier");
      const emptyFields = [];
      if (!form.tpin) emptyFields.push("TPIN");
      if (!form.supplierName) emptyFields.push("Supplier Name");
      if (!form.taxCategory) emptyFields.push("Tax Category");
      if (!form.contactPerson) emptyFields.push("Contact Person");
      if (!form.phoneCode || !form.phoneNo) emptyFields.push("Phone Number");
      if (!form.emailId) emptyFields.push("Email");

      const message =
        emptyFields.length > 0
          ? `Please fill in required fields: ${emptyFields.join(", ")}`
          : "Please fix validation errors in Supplier tab";
      showValidationError(message);
      return;
    }

    if (!paymentValid) {
      setActiveTab("payment");
      const emptyFields = [];
      if (!form.currency) emptyFields.push("Currency");
      if (!form.paymentTerms) emptyFields.push("Credit Days");
      if (!form.dateOfAddition) emptyFields.push("Date of Addition");
      if (!form.openingBalance && form.openingBalance !== 0)
        emptyFields.push("Opening Balance");

      const message =
        emptyFields.length > 0
          ? `Please fill the following required fields:\n• ${emptyFields.join("\n• ")}`
          : "Please fix validation errors in Payment tab";
      showValidationError(message);
      return;
    }

    if (!addressValid) {
      setActiveTab("address");
      const emptyFields = [];
      if (!form.billingAddressLine1) emptyFields.push("Address Line 1");
      if (!form.billingCity) emptyFields.push("City");
      if (!form.billingCountry) emptyFields.push("Country");
      if (!form.district) emptyFields.push("District");
      if (!form.province) emptyFields.push("Province");
      if (!form.billingPostalCode) emptyFields.push("Postal Code");

      const message =
        emptyFields.length > 0
          ? `Please fill the following required fields:\n• ${emptyFields.join("\n• ")}`
          : "Please fix validation errors in Address tab";
      showValidationError(message);
      return;
    }

    try {
      setLoading(true);

      const formattedForm = {
        ...form,
        phoneNo: `${form.phoneCode || ""}${form.phoneNo || ""}`,
        alternateNo: `${form.alternateCode || ""}${form.alternateNo || ""}`,
      };

      const payload = mapSupplierToApi(formattedForm, initialData?.supplierId);
      let res: any;
      if (isEditMode) {
        if (!initialData?.supplierId) {
          showApiError("Supplier ID is required for update");
          return;
        }
        res = await updateSupplier(initialData.supplierId, payload);
      } else {
        res = await createSupplier(payload);
      }

      /* Backend failure */
      const statusCode = res?.message?.status_code;

      if (!res || ![200, 201].includes(statusCode)) {
        showApiError(res?.message || res);
        return;
      }
      /* Step 2 — Bank accounts (only on create, not edit) */
      if (!isEditMode) {
        const bankAccounts = form.bankAccounts || [];

        if (bankAccounts.length > 0) {
          const results = await Promise.all(
            bankAccounts.map((acc) =>
              createNewBankAccount({
                accountFor: "Supplier",
                partyName: form.supplierName,
                bankName: acc.bankName,
                accountNo: acc.accountNumber,
                accountHolderName: acc.accountHolder,
                sortCode: acc.sortCode,
                branchAddress: acc.branchAddress || "",
                isDefault: acc.isDefault ? "1" : "0",
                currency: form.currency || "",
                dateAdded:
                  form.dateOfAddition || new Date().toISOString().split("T")[0],
              }),
            ),
          );

          const failed = results.filter(
            (res) => !res || ![200, 201].includes(res.status_code),
          );

          if (failed.length > 0) {
            console.error("Bank account failures:", failed);
            throw new Error(`${failed.length} bank account(s) failed to save`);
          }
        }
      }

      /* Success */
      const successMessage =
        res?.message?.message ||
        res?.message ||
        (isEditMode ? "Supplier Updated" : "Supplier Created");

      showSuccess(successMessage);
      onSuccess?.(form);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (initialData && isEditMode) {
      const mapped = mapSupplierToForm(initialData);

      if (!mapped.bankAccounts?.length) {
        mapped.bankAccounts = [
          {
            id: crypto.randomUUID(),
            bankName: "",
            accountNumber: "",
            accountHolder: "",
            sortCode: "",
            swiftCode: "",
            branchAddress: "",
            isDefault: true,
          },
        ];
      }

      const hasDefault = mapped.bankAccounts.some((a) => a.isDefault);
      if (!hasDefault) {
        mapped.bankAccounts[0].isDefault = true;
      }

      setForm({
        ...mapped,
        terms: {
          buying: mapped.terms?.buying?.payment?.phases?.length
            ? mapped.terms.buying
            : (companyBuyingTerms ?? emptySupplierForm.terms?.buying),
        },
      });
    } else {
      setForm({
        ...emptySupplierForm,
        dateOfAddition: new Date().toISOString().split("T")[0],

        bankAccounts: [
          {
            id: crypto.randomUUID(),
            bankName: "",
            accountNumber: "",
            accountHolder: "",
            sortCode: "",
            swiftCode: "",
            branchAddress: "",
            isDefault: true,
          },
        ],

        terms: {
          buying: companyBuyingTerms ?? emptySupplierForm.terms?.buying,
        },
      });
    }

    setErrors({});
    setIsCodeEdited(false);
    setAllowSubmit(false);
  };
  // Handle Next Tab with Validation
  const handleNext = () => {
    let isValid = false;

    if (activeTab === "supplier") {
      isValid = validateSupplierTab();
      if (!isValid) {
        const emptyFields = [];
        if (!form.tpin) emptyFields.push("TPIN");
        if (!form.supplierName) emptyFields.push("Supplier Name");
        if (!form.taxCategory) emptyFields.push("Tax Category");
        if (!form.contactPerson) emptyFields.push("Contact Person");
        if (!form.phoneCode || !form.phoneNo) emptyFields.push("Phone Number");
        if (!form.emailId) emptyFields.push("Email");
        if (!form.currency) emptyFields.push("Currency");
        if (!form.paymentTerms) emptyFields.push("Credit Days");
        if (!form.dateOfAddition) emptyFields.push("Date of Addition");
        if (!form.openingBalance && form.openingBalance !== 0)
          emptyFields.push("Opening Balance");

        const message =
          emptyFields.length > 0
            ? `Please fill the following required fields:\n• ${emptyFields.join("\n• ")}`
            : "Please fix validation errors in Supplier tab";
        showValidationError(message);
        return;
      }
    } else if (activeTab === "payment") {
      isValid = validatePaymentTab();
      if (!isValid) {
        const emptyFields = [];

        if (!form.bankAccounts || form.bankAccounts.length === 0) {
          emptyFields.push("Bank Accounts");
        } else {
          const invalid = form.bankAccounts.some(
            (acc) =>
              !acc.bankName ||
              !acc.accountNumber ||
              !acc.accountHolder ||
              !acc.sortCode,
          );

          if (invalid) {
            emptyFields.push("Complete Bank Account Details");
          }
        }

        const message =
          emptyFields.length > 0
            ? `Please fill the following required fields:\n• ${emptyFields.join("\n• ")}`
            : "Please fix validation errors in Payment tab";
        showValidationError(message);
        return;
      }
    } else if (activeTab === "address") {
      isValid = validateAddressTab();
      if (!isValid) {
        const emptyFields = [];
        if (!form.billingAddressLine1) emptyFields.push("Address Line 1");
        if (!form.billingCity) emptyFields.push("City");
        if (!form.billingCountry) emptyFields.push("Country");
        if (!form.district) emptyFields.push("District");
        if (!form.province) emptyFields.push("Province");
        if (!form.billingPostalCode) emptyFields.push("Postal Code");

        const message =
          emptyFields.length > 0
            ? `Please fill the following required fields:\n• ${emptyFields.join("\n• ")}`
            : "Please fix validation errors in Address tab";
        showValidationError(message);
        return;
      }
    }

    if (isValid) {
      goToNextTab();
    }
  };

  // Next Tab
  const goToNextTab = () => {
    const tabs: SupplierTab[] = ["supplier", "payment", "address", "terms"];

    const currentIndex = tabs.indexOf(activeTab);

    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  return {
    form,
    loading,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    reset,
    goToNextTab,
    handleNext,
    errors,
    handleTermsChange,
  };
};
