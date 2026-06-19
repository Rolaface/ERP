const MASTER_SITE_HOSTNAME = "master.erp.rolaface.com";

export const isMasterSite = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.location.hostname === MASTER_SITE_HOSTNAME;
};