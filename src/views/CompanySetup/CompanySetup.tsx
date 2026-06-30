import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Building2,
  IdCard,
  Landmark,
  Wallet,
  Repeat,
  Layers,
  FileText,
  UploadCloud,
  Hash,
  Sliders
} from "lucide-react";
import { useCompanyStore } from "../../store/companyStore";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import { useUrlTab } from "../../hooks/useUrlTab";
import BasicDetails from "./BasicDetails";
import AccountingDetails from "./AccountingDetails";
import BuyingSelling from "./BuyingSelling";
import SubscribedModules from "./subscribedmodule";
import BankDetails from "./BankDetails";
import Upload from "./upload";
import NamingSeries from "./NamingSeries";
import CompanyDefaults from "./CompanyDefaults";
import Templates from "./Templates";
import type {
  CompanyDocuments,
  AccountingSetup,
  BankAccount,
  BasicDetailsForm,
  Company,
  FinancialConfig,
  ModuleSubscriptions,
  RegistrationDetails,
  CompanyTemplates,
} from "../../types/company";
import { getCompanyById } from "../../api/companySetupApi";
import type { Terms } from "../../types/termsAndCondition";
import { showConfirm } from "../../utils/alert";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;
const BASE = "/companySetup";
const DEFAULT_TAB = "basic";

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const navTabs = [
  { id: "basic", label: "Basic Details", icon: <IdCard {...iconProps} /> },
  { id: "bank", label: "Bank Details", icon: <Landmark {...iconProps} /> },
  { id: "accounting", label: "Accounting Details", icon: <Wallet {...iconProps} /> },
  { id: "buyingSelling", label: "Buying & Selling", icon: <Repeat {...iconProps} /> },
  { id: "subscribed", label: "Subscription", icon: <Layers {...iconProps} /> },
  { id: "Templates", label: "Templates", icon: <FileText {...iconProps} /> },
  { id: "logo", label: "Logo & Signature", icon: <UploadCloud {...iconProps} /> },
  { id: "naming", label: "Naming Series", icon: <Hash {...iconProps} /> },
  { id: "defaults", label: "Company Defaults", icon: <Sliders {...iconProps} /> },
];

const CompanySetup: React.FC = () => {
  const [activeTab, handleTabChange] = useUrlTab({
    tabs: navTabs,
    defaultTab: DEFAULT_TAB,
    basePath: BASE,
    pathPrefix: BASE,
  });

  const isBasicTab = activeTab === DEFAULT_TAB;
  // const [isDirty, setIsDirty] = useState(false);
  const [unsavedFields, setUnsavedFields] = useState<string[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>();

  const [terms, setTerms] = useState<Terms>();
  const [, setCompanyDetail] = useState<Company | null>(null);
  const [, setModules] = useState<ModuleSubscriptions | null>(null);
  const [accountingSetup, setAccountingSetup] = useState<AccountingSetup | null>(null);
  const [companytemplates, setCompanyTemplates] = useState<CompanyTemplates | null>(null);
  const [, setCompanyDocuments] = useState<CompanyDocuments | null>(null);
  const [, setLoading] = useState(true);
  const [basicDetail, setBasicDetail] = useState<BasicDetailsForm>({
    registration: {
      registerNo: "",
      tpin: "",
      companyName: "",
      dateOfIncorporation: "",
      companyType: "",
      companyStatus: "",
      industryType: "",
      domain: "",
      defaultModeOfPayment: "",
    },
    contact: {
      companyEmail: "",
      companyPhone: "",
      alternatePhone: "",
      website: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
    },
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      province: "",
      postalCode: "",
      country: "",
      timeZone: "",
    },
  });

  // const handleTabClick = async (newTabId: string) => {
  //   if (newTabId === activeTab) return;

  //   if (isDirty) {
  //     const isConfirmed = await showConfirm(
  //       "You have unsaved changes left. Do you want to discard them and switch tabs?",
  //       {
  //         title: "Warning",
  //         confirmButtonText: "Discard & Leave",
  //         confirmButtonColor: "#ef4444",
  //         cancelButtonText: "Stay",
  //       }
  //     );
      
  //     if (!isConfirmed) return;  
  //     setIsDirty(false); 
  //   }
    
  //   handleTabChange(newTabId);
  // };
  const handleTabClick = async (newTabId: string) => {
    if (newTabId === activeTab) return;

    if (unsavedFields.length > 0) {
      const fieldNames = unsavedFields.join(", ");  
      
      const isConfirmed = await showConfirm(
        `You have unsaved changes on: ${fieldNames}. Do you want to discard them and switch tabs?`,
        {
          title: "Warning",
          confirmButtonText: "Discard & Leave",
          confirmButtonColor: "#ef4444",
          cancelButtonText: "Stay",
        }
      );
      
      if (!isConfirmed) return; 
      setUnsavedFields([]); // Reset since they are leaving
    }
    
    handleTabChange(newTabId);
  };

  const fetchCompanyDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompanyById(COMPANY_ID);
      setCompanyDetail(response.data as Company);

      const registrationDetails: RegistrationDetails = {
        registerNo: response.data.registrationNumber ?? "",
        tpin: response.data.tpin ?? "",
        companyName: response.data.companyName ?? "",
        dateOfIncorporation: response.data.dateOfIncorporation ?? "",
        companyType: response.data.companyType ?? "",
        companyStatus: response.data.companyStatus ?? "",
        industryType: response.data.industryType ?? "",
        domain: response.data.primaryBusinessDomain ?? "",
        defaultModeOfPayment: response.data.defaultPaymentMode ?? "",
      };

      setAccountingSetup(
        response.data.accountingSetup ?? {
          chartOfAccounts: "Standard Chart - 2025",
          defaultExpenseGL: "5000-EXP-GENERAL",
          fxGainLossAccount: "4300-FX-GAIN-LOSS",
          revaluationFrequency: "Monthly",
          roundOffAccount: "4800-ROUND-OFF",
          roundOffCostCenter: "CC-001-MAIN",
          depreciationAccount: "5100-DEPRECIATION",
          appreciationAccount: "5200-ASSET-APPRECIATION",
        },
      );

      setBasicDetail({
        registration: registrationDetails,
        contact: response.data.contactInfo,
        address: response.data.address,
      });

  
      useCompanyStore.getState().setCompanyInfo({
        companyName: response.data.companyName ?? "",
        baseCurrency: response.data.baseCurrency ?? "",
        domain: response.data.primaryBusinessDomain ?? "",
        industryType: response.data.industryType ?? "",
        currencySymbol: response.data.currencySymbol ?? response.data.baseCurrency ?? "",
        companyAddress: response.data.address ?? {},
      });

      setBankAccounts(response.data.bankAccounts ?? []);
      setTerms(response.data.terms);
      setFinancialConfig(response.data.financialConfig);
      setModules(response.data.modules);
      setCompanyTemplates(response.data.templates);
      setCompanyDocuments(response.data.documents);
    } catch (err) {
      console.error("Error loading company data:", err);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ dependency array bhi clean — setCompanyInfo nahi hai ab

  useEffect(() => {
    fetchCompanyDetail();
  }, [fetchCompanyDetail]);

  const tabComponents = useMemo(
    () => ({
      basic: (
        <BasicDetails
          basic={basicDetail}
          // onSaveSuccess={
          onSaveSuccess={() => {
            setUnsavedFields([]);
            fetchCompanyDetail
          }}
          terms={terms}
          setUnsavedFields={setUnsavedFields}
        />
      ),
      bank: (
        <BankDetails
          bankAccounts={bankAccounts}
          setBankAccounts={setBankAccounts}
          terms={terms}
        />
      ),
      accounting: (
        <AccountingDetails
          financialConfig={financialConfig}
          accountingSetup={accountingSetup}
          terms={terms}
        />
      ),
      // buyingSelling: (
      //   <BuyingSelling terms={terms} onSaveSuccess={fetchCompanyDetail} />
      // ),
      buyingSelling: (
        <BuyingSelling 
          terms={terms} 
          onSaveSuccess={() => {
            setUnsavedFields([]);  
            fetchCompanyDetail();
          }} 
          setUnsavedFields={setUnsavedFields}  
        />
      ),
      naming: <NamingSeries onSaveSuccess={fetchCompanyDetail} />,
      defaults: (
        <CompanyDefaults
          onSaveSuccess={fetchCompanyDetail}
        />
      ),
      subscribed: <SubscribedModules />,
      Templates: <Templates templates={companytemplates} />,
      logo: (
        <Upload COMPANY_ID={COMPANY_ID} onUploadSuccess={fetchCompanyDetail} />
      ),
    }),
    [
      basicDetail,
      bankAccounts,
      financialConfig,
      accountingSetup,
      companytemplates,
      terms,
      fetchCompanyDetail,
    ],
  );

  const currentTabComponent =
    tabComponents[activeTab as keyof typeof tabComponents] ??
    tabComponents[DEFAULT_TAB];

  return (
    <AppPage viewportLocked={isBasicTab}>
      <AppPageHeader title="Company Setup" icon={<Building2 />} />
      {/* <AppTabs tabs={navTabs} activeTab={activeTab} onChange={handleTabChange} /> */}
      <AppTabs tabs={navTabs} activeTab={activeTab} onChange={handleTabClick} />
      <AppPageBody>{currentTabComponent}</AppPageBody>
    </AppPage>
  );
};

export default CompanySetup;