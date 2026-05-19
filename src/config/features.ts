export const FEATURES = {
  CHAT_ENABLED: import.meta.env.VITE_ENABLE_CHAT
    ? import.meta.env.VITE_ENABLE_CHAT === 'true'
    : true,
};