const SESSION_EXPIRED_EVENT = "session-expired";

export const emitSessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

export const onSessionExpired = (callback: () => void): (() => void) => {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
};