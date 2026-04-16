import React, { createContext, useCallback, useContext, useState } from "react";

export type QuickAddEntityType = "customer" | "supplier" | "item" | "customerGroup";

export interface QuickAddPending {
  fieldId: string;
  entityType: QuickAddEntityType;
  callback: (entity: { id: string; name: string }) => void;
}

interface QuickAddContextValue {
  pending: QuickAddPending | null;
  initiateQuickAdd: (
    fieldId: string,
    entityType: QuickAddEntityType,
    callback: (entity: { id: string; name: string }) => void
  ) => void;
  completeQuickAdd: (entity: { id: string; name: string }) => void;
  cancelQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export const useQuickAdd = () => {
  const ctx = useContext(QuickAddContext);
  if (!ctx) {
    throw new Error("useQuickAdd must be used within QuickAddProvider");
  }
  return ctx;
};

export const QuickAddProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<QuickAddPending | null>(null);

  const initiateQuickAdd = useCallback(
    (
      fieldId: string,
      entityType: QuickAddEntityType,
      callback: (entity: { id: string; name: string }) => void
    ) => {
      setPending({ fieldId, entityType, callback });
    },
    []
  );

  const completeQuickAdd = useCallback(
    (entity: { id: string; name: string }) => {
      if (pending?.callback) {
        pending.callback(entity);
      }
      setPending(null);
    },
    [pending]
  );

  const cancelQuickAdd = useCallback(() => {
    setPending(null);
  }, []);

  return (
    <QuickAddContext.Provider
      value={{
        pending,
        initiateQuickAdd,
        completeQuickAdd,
        cancelQuickAdd,
      }}
    >
      {children}
    </QuickAddContext.Provider>
  );
};