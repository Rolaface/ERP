export const parseFrappeError = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return err?.message || "An unknown error occurred.";

  const cleanMessage = (msg: string) => {
    if (!msg) return "";
    return String(msg)
      .replace(/<[^>]*>?/gm, "")  
      .replace(/\s+/g, " ")     
      .trim();
  };
  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages);
      if (messages.length > 0) {
        const msgObj = JSON.parse(messages[0]);
        if (msgObj.message) {
          return cleanMessage(msgObj.message);
        }
      }
    } catch (e) {
      console.error("Failed to parse _server_messages", e);
    }
  }
  if (data.exception) {
    const parts = String(data.exception).split(":");
    if (parts.length > 1) {
      return cleanMessage(parts.slice(1).join(":")); 
    }
    return cleanMessage(data.exception);
  }
  return data.message 
    ? cleanMessage(data.message) 
    : (err?.message || "An error occurred.");
};
