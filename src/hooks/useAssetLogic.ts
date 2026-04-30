import { useState } from "react";
import { createAsset } from "../api/assetapi";
import { getAssetCategoryOptions } from "../api/faapi";
import {
  checkLocationExists as checkLocationExistsApi,
  createLocation,
} from "../api/location";

export const useAssetLogic = () => {
  const [loading, setLoading] = useState(false);

const buildPayload = (form: any) => {
  const payload: any = {
    asset_name: form.assetName,
    item_code: form.itemCode,
    asset_category: form.assetCategory,
    location: form.location,
    asset_type: form.assetType,

    maintenance_required: (form.maintenanceRequired ? 1 : 0) as 0 | 1,
    calculate_depreciation: (form.calculateDepreciation ? 1 : 0) as 0 | 1,
    comprehensive_insurance: (form.comprehensiveInsurance ? 1 : 0) as 0 | 1,
    purchase_date: form.purchaseDate || form.availableForUseDate,

    purchase_receipt: form.purchaseReceipt,
    net_purchase_amount: Number(form.netPurchaseAmount || 0),
    purchase_invoice: form.purchaseInvoice,
    asset_quantity: Number(form.assetQuantity || 1),
    available_for_use_date: form.availableForUseDate,

    cost_center: form.costCenter,

    asset_owner: form.assetOwner,
    asset_owner_company: form.assetOwnerCompany,

    policy_number: form.policyNumber,
    insurance_start_date: form.insuranceStartDate,
    insurer: form.insurer,
    insurance_end_date: form.insuranceEndDate,
    insured_value: Number(form.insuredValue || 0),

    status: form.status,
    custodian: form.custodian,
    department: form.department,
  };

  
  if (form.calculateDepreciation) {
    const books = form.financeBooks?.length
      ? form.financeBooks
      : [
          {
            financeBook: "Company Default",
            depreciationMethod: "Straight Line Method",
            frequencyOfDepreciation: "Yearly",
            totalNumberOfDepreciations: 1,
            depreciationStartDate: form.availableForUseDate,
            expectedValueAfterUsefulLife: 0,
          },
        ];

    payload.finance_books = books.map((fb: any) => ({
      finance_book: fb.financeBook || "Company Default",

      depreciation_method:
        fb.depreciationMethod === "Straight Line Method"
          ? "Straight Line"
          : fb.depreciationMethod,

      frequency_of_depreciation:
        fb.frequencyOfDepreciation === "Monthly"
          ? 1
          : fb.frequencyOfDepreciation === "Quarterly"
          ? 2
          : fb.frequencyOfDepreciation === "Half-Yearly"
          ? 3
          : 4,

      total_number_of_depreciations: fb.totalNumberOfDepreciations || 1,

      depreciation_start_date:
        fb.depreciationStartDate || form.availableForUseDate,

      expected_value_after_useful_life:
        fb.expectedValueAfterUsefulLife || 0,
    }));
  }

  return payload;
};
  const fetchAssetCategories = (q: string) => {
    return getAssetCategoryOptions(q);
  };

  const checkLocationExists = async (location: string) => {
    return checkLocationExistsApi(location.trim());
  };

  const createMaintainedLocation = async (location: string) => {
    const trimmed = location.trim();

    // Always re-check right before creating — prevents race conditions
    // and cases where checkLocationExistsApi returned falsy incorrectly
    const alreadyExists = await checkLocationExistsApi(trimmed);
    if (alreadyExists) {
      return alreadyExists;
    }

    try {
      const response = await createLocation(trimmed);
      return response?.data?.name ?? trimmed;
    } catch (error: any) {
      const message = String(error?.message ?? "").toLowerCase();

      // If the API itself says duplicate, fetch and return existing
      if (message.includes("duplicate") || message.includes("already exists")) {
        const existingLocation = await checkLocationExistsApi(trimmed);
        if (existingLocation) return existingLocation;
      }

      throw error;
    }
  };

  const handleCreateAsset = async (form: any, resolvedLocation?: string) => {
    try {
      setLoading(true);

      const payload = buildPayload({
        ...form,
        location: resolvedLocation ?? form.location,
      });

      console.log("FINAL PAYLOAD ", payload);

      return await createAsset(payload);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkLocationExists,
    createMaintainedLocation,
    handleCreateAsset,
    fetchAssetCategories,
  };
};