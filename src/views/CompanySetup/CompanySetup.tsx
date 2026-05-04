import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  IdCard,
  Landmark,
  Wallet,
  Repeat,
  Layers,
  FileText,
  UploadCloud
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import BasicDetails from "./BasicDetails";
import AccountingDetails from "./AccountingDetails";
import BuyingSelling from "./BuyingSelling";
import SubscribedModules from "./subscribedmodule";
import BankDetails from "./BankDetails";
import Upload from "./upload";
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

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;
const BASE = "/companySetup";
const DEFAULT_TAB = "basic";

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const navTabs = [
  {
    id: "basic",
    label: "Basic Details",
    icon: <IdCard {...iconProps} />, 
  },
  {
    id: "bank",
    label: "Bank Details",
    icon: <Landmark {...iconProps} />, 
  },
  {
    id: "accounting",
    label: "Accounting Details",
    icon: <Wallet {...iconProps} />, 
  },
  {
    id: "buyingSelling",
    label: "Buying & Selling",
    icon: <Repeat {...iconProps} />, 
  },
  {
    id: "subscribed",
    label: "Subscription",
    icon: <Layers {...iconProps} />, 
  },
  {
    id: "Templates",
    label: "Templates",
    icon: <FileText {...iconProps} />,
  },
  {
    id: "logo",
    label: "Logo & Signature",
    icon: <UploadCloud {...iconProps} />, 
  },
];

const CompanySetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path === BASE || path === `${BASE}/`) return DEFAULT_TAB;
    return path.replace(`${BASE}/`, "") || DEFAULT_TAB;
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (path === BASE || path === `${BASE}/`) {
      navigate(`${BASE}/${DEFAULT_TAB}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabChange = useCallback((tabId: string) => {
    navigate(`${BASE}/${tabId}`, { replace: true });
  }, [navigate]);

  const isBasicTab = activeTab === DEFAULT_TAB;

  // ── Data state (unchanged from original)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>();
  const [terms, setTerms] = useState<Terms>();
  const [companyDetail, setCompanyDetail] = useState<Company | null>(null);
  const [modules, setModules] = useState<ModuleSubscriptions | null>(null);
  const [accountingSetup, setAccountingSetup] = useState<AccountingSetup | null>(null);
  const [companytemplates, setCompanyTemplates] = useState<CompanyTemplates | null>(null);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [basicDetail, setBasicDetail] = useState<BasicDetailsForm>({
    registration: {
      registerNo: "",
      tpin: "",
      companyName: "",
      dateOfIncorporation: "",
      companyType: "",
      companyStatus: "",
      industryType: "",
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
        }
      );

      setBasicDetail({
        registration: registrationDetails,
        contact: response.data.contactInfo,
        address: response.data.address,
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
  }, []);

  useEffect(() => {
    fetchCompanyDetail();
  }, [fetchCompanyDetail]);

  // ── Stable tab components — no remount on tab switch (same pattern as Inventory)
  const tabComponents = useMemo(() => ({
    basic: (
      <BasicDetails
        basic={basicDetail}
        onSaveSuccess={fetchCompanyDetail}
        terms={terms}
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
    buyingSelling: (
      <BuyingSelling terms={terms} onSaveSuccess={fetchCompanyDetail} />
    ),
    subscribed: <SubscribedModules />,
    Templates: <Templates templates={companytemplates} />,
    logo: (
      <Upload
        COMPANY_ID={COMPANY_ID}
        onUploadSuccess={fetchCompanyDetail}
      />
    ),
  }), [
    basicDetail,
    bankAccounts,
    financialConfig,
    accountingSetup,
    companytemplates,
    terms,
    fetchCompanyDetail,
  ]);

  const currentTabComponent =
    tabComponents[activeTab as keyof typeof tabComponents] ??
    tabComponents[DEFAULT_TAB];

  return (
    <AppPage viewportLocked={isBasicTab}>
      <AppPageHeader
        title="Company Setup"
        icon={<Building2  />}
      />
      <AppTabs
        tabs={navTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      <AppPageBody viewportLocked={isBasicTab}>
        {currentTabComponent}
      </AppPageBody>
    </AppPage>
  );
};

export default CompanySetup;