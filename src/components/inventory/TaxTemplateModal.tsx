import React from "react";
import { Tag } from "lucide-react";

import { GenericTaxTemplateModal, TemplateConfig } from "./GenericTemplateModal";
import { type TaxCategoryFormData } from "../../types/tax/taxTemplate";
import { getGlAccounts } from "../../api/TaxTemplateApi";

interface TaxTemplateModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TaxCategoryFormData) => void;
  initialData?: TaxCategoryFormData | null;
  isEditMode?: boolean;
}

const taxTemplateConfig: TemplateConfig = {
  title: "Tax Template",
  subtitle: "Create simple tax template",
  icon: Tag,
  customWidth: "46vw",
  height: "66vh",
  rowsPerPage: 4,
  formFields: [
    {
      key: "title",
      label: "Title",
      type: "text",
      placeholder: "Template title",
      required: true,
    },
  ],
  rowFields: [
    {
      key: "tax_type",
      label: "Tax Type",
      type: "select",
      placeholder: "Select tax type",
      required: true,
      fetchOptions: async (search: string) => {
        try {
          const res = await getGlAccounts(search || undefined);
          const data: { name: string; description: string }[] = res?.data ?? [];
          return data.map((opt) => ({
            value: opt.name,
            label: opt.description ? `${opt.name} — ${opt.description}` : opt.name,
          }));
        } catch {
          return [];
        }
      },
    },
    {
      key: "tax_rate",
      label: "Rate (%)",
      type: "number",
      placeholder: "0",
      required: true,
      validation: (value: any) => {
        const num = Number(value);
        const valid = !isNaN(num);
        if (!valid) return "Invalid rate";
        if (num < 0) return "Invalid rate";
        return null;
      },
    },
  ],
};

export const TaxTemplateModal: React.FC<TaxTemplateModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
}) => {
  return (
    <GenericTaxTemplateModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={initialData}
      isEditMode={isEditMode}
      config={taxTemplateConfig}
    />
  );
};

export default TaxTemplateModal;