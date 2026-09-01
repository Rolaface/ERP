export interface AppUrls {
  apiBaseUrl: string;
  erpFrontendUrl: string;
  lmsFrontendUrl: string;
}

export const resolveAppUrls = (): AppUrls => {
  const fallbacks: AppUrls = {
    apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "") as string,
    erpFrontendUrl: (import.meta.env.VITE_ERP_URL ?? "") as string,
    lmsFrontendUrl: (import.meta.env.VITE_LMS_URL ?? "") as string,
  };

  if (typeof window === "undefined") {
    return fallbacks;
  }

  const { protocol, hostname } = window.location;
  
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.endsWith(".local")
  ) {
    return fallbacks;
  }

  const hostSegments = hostname.split(".");
  if (hostSegments.length < 3) {
    return fallbacks;
  }

  const tenantSubdomain = hostSegments[0]; 
  const baseDomain = hostSegments.slice(-2).join("."); 
  
  const isValidTenant = /^[a-z0-9-]+$/i.test(tenantSubdomain);
  if (!isValidTenant) {
    return fallbacks;
  }

  return {
    apiBaseUrl: `${protocol}//api.erp.${tenantSubdomain}.${baseDomain}`,
    erpFrontendUrl: `${protocol}//${tenantSubdomain}.erp.${baseDomain}`,
    lmsFrontendUrl: `${protocol}//${tenantSubdomain}.lms.${baseDomain}`,
  };
};

export const { 
  apiBaseUrl: ERP_BASE, 
  erpFrontendUrl: ERP_FRONTEND, 
  lmsFrontendUrl: LMS_FRONTEND 
} = resolveAppUrls();