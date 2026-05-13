export interface CustomerContact {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  salutation?: string;
  gender?: string;
  companyName?: string;
  status?: string;           
  email: string;
  mobile: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
  isBilling: boolean;
}

export interface CustomerAddress {
  id?: string;
  type: "Billing" | "Shipping" | string;
  line1: string;
  line2?: string;
  city?: string;
  county?: string ;   
  state?: string;
  postalCode?: string;
  country?: string;
  isPrimary?: boolean;
  isShipping?: boolean;
}

export interface CustomerTermsPhase {
  id?: string;
  name: string;
  percentage: number | string;
  condition?: string;
  credit_days?: number | string;
}

export interface CustomerTermsPayment {
  phases: CustomerTermsPhase[];
  dueDates?: string;
  lateCharges?: string;
  taxes?: string;
  notes?: string;
}

export interface SellingTerms {
  general?: string;
  delivery?: string;
  cancellation?: string;
  warranty?: string;
  liability?: string;
  payment: CustomerTermsPayment;
}



export interface CustomerSummary {
  id: string;
  name: string;                    
  tpin?: string;
  customerTaxCategory?: string;    
  displayName?: string;           
  type?: "" | "Company" | "Individual";
  customerGroup?: string;
  accountNumber?: string;
  currency?: string;
  onboardingBalance?: number;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;             
  contactPerson?: string;
  mobileCode?: string;
  mobile?: string;
  email?: string;
  dateOfAddition?: string;
}



export interface CustomerDetail extends CustomerSummary {
  contacts?: CustomerContact[];
  addresses?: CustomerAddress[];
  terms?: {
    Selling?: SellingTerms;  
    selling?: SellingTerms;  
  };
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
}