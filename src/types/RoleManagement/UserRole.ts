export interface PermissionEntry {
  module: string;
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  import: 0 | 1;
  export: 0 | 1;
  report: 0 | 1;
}

export interface UserRoleFormData {
  role: string;
  permission: PermissionEntry[];
   disabled?: 0 | 1;
   roleId?: string;
}


export type UserRole = UserRoleFormData;


export const EMPTY_FORM: UserRole = {
  role: "",
  permission: [],
};


