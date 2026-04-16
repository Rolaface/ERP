import Swal from "sweetalert2";
import type { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

export const APP_SWAL_OPEN_EVENT = "erp:swal-open";
export const APP_SWAL_CLOSE_EVENT = "erp:swal-close";

const DEFAULT_SWAL_CLASSES = {
  container: "app-swal-container",
  popup: "app-swal-popup",
};

let openSwalCount = 0;

const dispatchSwalEvent = (eventName: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: { openCount: openSwalCount },
    })
  );
};

const markSwalOpen = () => {
  openSwalCount += 1;
  document.body.classList.add("app-swal-open");
  dispatchSwalEvent(APP_SWAL_OPEN_EVENT);
};

const markSwalClosed = () => {
  openSwalCount = Math.max(openSwalCount - 1, 0);

  if (openSwalCount === 0) {
    document.body.classList.remove("app-swal-open");
  }

  dispatchSwalEvent(APP_SWAL_CLOSE_EVENT);
};

const mergeClassNames = (
  customClass: SweetAlertOptions["customClass"]
): SweetAlertOptions["customClass"] => ({
  ...customClass,
  container: [DEFAULT_SWAL_CLASSES.container, customClass?.container]
    .filter(Boolean)
    .join(" "),
  popup: [DEFAULT_SWAL_CLASSES.popup, customClass?.popup]
    .filter(Boolean)
    .join(" "),
});

const withManagedDefaults = <T>(
  options: SweetAlertOptions<T>
): SweetAlertOptions<T> => ({
  target: document.body,
  heightAuto: false,
  returnFocus: false,
  allowOutsideClick: options.allowOutsideClick ?? (() => !Swal.isLoading()),
  ...options,
  customClass: mergeClassNames(options.customClass),
});

export const fireManagedSwal = async <T = unknown>(
  options: SweetAlertOptions<T>
): Promise<SweetAlertResult<T>> => {
  markSwalOpen();

  try {
    return await Swal.fire(withManagedDefaults(options));
  } finally {
    markSwalClosed();
  }
};

export const closeManagedSwal = () => {
  Swal.close();
};
