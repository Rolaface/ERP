export interface CreateUserFormData {
   id?: string;
  email: string;
  username: string;
  language: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  roleIds: string[];
  gender?: string;
  phone?: string;
  dob?: string;
  timezone?: string;
  mobile_no?: string;
}

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type GenderOption = (typeof GENDER_OPTIONS)[number];