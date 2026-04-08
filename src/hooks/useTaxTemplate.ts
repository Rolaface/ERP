import { useState } from "react";
import { createTemplate } from "../api/TaxTemplateApi";
import { showLoading,showApiError,showSuccess,closeSwal } from "../utils/alert";

export const useTaxTemplate = () => {
  const [loading, setLoading] = useState(false);

  const createTaxTemplate = async (form: any) => {
    setLoading(true);

    try {
      showLoading("Creating Template...");

      const payload = {
        title: form.title,
        disabled: form.disabled ? 1 : 0,
        taxes: [
          {
            tax_rate: Number(form.taxRate),
          },
        ],
      };

      const res = await createTemplate(payload);

      closeSwal();
      showSuccess("Tax Template created successfully");

      return res;
    } catch (error) {
      closeSwal();
      showApiError(error); 
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTaxTemplate,
    loading,
  };
};