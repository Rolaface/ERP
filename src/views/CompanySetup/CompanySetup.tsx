// CompanySetup.tsx
import React, { useEffect, useState } from "react";
import {
  FaBuilding,
  FaIdCard,
  FaMoneyCheckAlt,
  FaExchangeAlt,
  FaEnvelope,
  FaUniversity,
  FaRegFile,
  FaFileUpload,
} from "react-icons/fa";
import BasicDetails from "./BasicDetails";
import AccountingDetails from "./AccountingDetails";
import BuyingSelling from "./BuyingSelling";
import SubscribedModules from "./subscribedmodule";
import BankDetails from "./BankDetails";
import Upload from "./upload";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

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
// import Templates from "./Templates";

const navTabs = [
  { key: "basic", label: "Basic Details", icon: <FaIdCard /> },
  { key: "bank", label: "Bank Details", icon: <FaUniversity /> },
  { key: "accounting", label: "Accounting Details", icon: <FaMoneyCheckAlt /> },
  { key: "buyingSelling", label: "Buying & Selling", icon: <FaExchangeAlt /> },
  { key: "subscribed", label: "Subscription", icon: <FaEnvelope /> },
  { key: "Templates", label: "Templates", icon: <FaRegFile /> },
  { key: "logo", label: "Logo & Signature", icon: <FaFileUpload /> },
];

const CompanySetup: React.FC = () => {
  const [tab, setTab] = useState(navTabs[0].key);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>();
  const [terms, setTerms] = useState<Terms>();
  const [companyDetail, setCompanyDetail] = useState<Company | null>(null);
  const [modules, setModules] = useState<ModuleSubscriptions | null>(null);
  const [accountingSetup, setAccountingSetup] =
    useState<AccountingSetup | null>(null);
  const [companytemplates, setCompanyTemplates] =
    useState<CompanyTemplates | null>(null);
  const [companyDocuments, setCompanyDocuments] =
    useState<CompanyDocuments | null>(null);
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

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      const response = await getCompanyById(COMPANY_ID);
      setCompanyDetail(response.data as Company);

      // console.log("response: ", response);
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
        },
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

      // console.log("accounsetup: ", response);
      // console.log("modules: ", response.data.modules);
      // console.log("document: ", response.data.documents);
      // console.log("templates: ", response.data.templates);
    } catch (err) {
      console.error("Error loading company data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetail();
  }, []);

  return (
    <div className="bg-app min-h-screen p-8 pb-20 text-main">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <FaBuilding className="text-primary" /> Company Setup
      </h1>

      {/* Navbar */}
      <div className="flex  mb-4 border-b border-gray-200 ">
        {navTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors
              ${
                tab === t.key
                  ? "text-primary border-b-2 border-current"
                  : "text-muted hover:text-main"
              }
            `}
            style={{ background: "transparent" }}
          >
            {t.icon}
            <span className="ml-1">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "basic" && <BasicDetails basic={basicDetail} />}
        {tab === "bank" && (
          <BankDetails
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
          />
        )}
        {tab === "accounting" && (
          <AccountingDetails
            financialConfig={financialConfig}
            accountingSetup={accountingSetup}
          />
        )}
        {tab === "buyingSelling" && <BuyingSelling terms={terms} />}
        {tab === "subscribed" && <SubscribedModules />}
        {/* {tab === "Templates" && <Templates templates={companyTemplates} />} */}
        {tab === "logo" && (
          <Upload
            COMPANY_ID={COMPANY_ID}
            onUploadSuccess={fetchCompanyDetail}
          />
        )}
      </div>
    </div>
  );
};

export default CompanySetup;
