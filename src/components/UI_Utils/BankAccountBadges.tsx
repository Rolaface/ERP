import React from "react";

export const DefaultBadge = ({
  isDefault,
}: {
  isDefault?: boolean | number;
}) =>
  isDefault ? (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
      Default
    </span>
  ) : null;

export const StatusBadge = ({
  isDisabled,
}: {
  isDisabled?: boolean | number;
}) =>
  isDisabled ? (
    <span className="text-red-500 font-semibold">Disabled</span>
  ) : (
    <span className="text-green-600 font-semibold">Active</span>
  );