import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Textarea, Checkbox } from "../../ui/modal/formComponent";
import type {
  PaymentRow,
  PurchaseOrderFormData,
} from "../../../types/Supply/purchaseOrder";

interface TermsTabProps {
  form: PurchaseOrderFormData;
  paymentRows: PaymentRow[];
  onTermsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onItemTermsToggle?: (
    termName: string,
    itemCode: string,
    isAccepted: boolean,
  ) => void;
}

export const TermsTab: React.FC<TermsTabProps> = ({
  form,
  onTermsChange,
  onItemTermsToggle,
}) => {
  return (
    <div className="space-y-6 bg-app text-main p-6">
      {/* ===== ITEM TERMS (PURE DATA RENDER) ===== */}
      {form.itemTerms?.length > 0 && (
        <div className="bg-card rounded-xl border border-theme overflow-hidden">
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {form.itemTerms.map((term, idx) => {
              const key = `${term.termName}-${term.itemCode}`;
              const isAccepted = !!form.acceptedTerms[key];

              return (
                <div
                  key={`${key}-${idx}`}
                  className={`p-4 rounded-lg border ${
                    isAccepted
                      ? "border-primary/50 bg-primary/5"
                      : "border-theme bg-app/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      label=""
                      checked={isAccepted}
                      onChange={(e) =>
                        onItemTermsToggle?.(
                          term.termName,
                          term.itemCode || "",
                          e.target.checked,
                        )
                      }
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-main">
                          {term.termName}
                        </span>

                        {term.itemCode && (
                          <span className="text-xs font-mono text-muted">
                            {term.itemCode}
                          </span>
                        )}

                        {isAccepted && (
                          <CheckCircle2 size={14} className="text-primary" />
                        )}
                      </div>

                      <p className="text-sm text-muted">{term.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== GENERAL TERMS (BACKEND DRIVEN) ===== */}
      <div className="bg-card rounded-xl border border-theme">
        <div className="p-4">
          <Textarea
            label=""
            name="termsAndConditions"
            value={form.termsAndConditions}
            onChange={onTermsChange}
            rows={12}
          />
        </div>
      </div>
    </div>
  );
};
