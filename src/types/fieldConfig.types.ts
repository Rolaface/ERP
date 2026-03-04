export type FieldType =
  | "text-input"
  | "api-select"
  | "static-select"
  | "textarea"
  | "number-input";

// Base shared properties
interface BaseFieldConfig {
  fieldName: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2 | 3 | 4;
}

// Text input
export interface TextFieldConfig extends BaseFieldConfig {
  fieldType: "text-input";
}

// Textarea
export interface TextareaFieldConfig extends BaseFieldConfig {
  fieldType: "textarea";
}

// Number input
export interface NumberFieldConfig extends BaseFieldConfig {
  fieldType: "number-input";
}

// API-driven select
export interface ApiFieldConfig extends BaseFieldConfig {
  fieldType: "api-select";
  apiFunctionName: string;
  customComponent?:
    | "ItemTreeSelect"
    | "ItemGenericSelect"
    | "ItemCategorySelect"
    | "";
}

// Static select
export interface StaticSelectConfig extends BaseFieldConfig {
  fieldType: "static-select";
  options: Array<{ value: string; label: string }>;
}

// Union type - TypeScript will discriminate based on fieldType
export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | ApiFieldConfig
  | StaticSelectConfig;
