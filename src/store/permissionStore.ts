import { create } from "zustand";

export interface RawPermission {
  module: string;
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  report: 0 | 1;
  import: 0 | 1;
  export: 0 | 1;
}

export interface NormalizedPermission {
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  report: boolean;
  import: boolean;
  export: boolean;
}

export type PermissionAction =
  | "read"
  | "write"
  | "create"
  | "delete"
  | "report"
  | "import"
  | "export";

interface PermissionState {
  permissions: Map<string, NormalizedPermission>;
  isLoading: boolean;
  isAdmin: boolean;          
  error: string | null;

  setPermissions: (raw: RawPermission[]) => void;
  setAdmin: (isAdmin: boolean) => void;  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPermissions: () => void;

  can: (module: string, action: PermissionAction) => boolean;
  canAccessModule: (module: string) => boolean;
  canAccessAnyOf: (modules: string[]) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: new Map(),
  isLoading: true,
  isAdmin: false,            
  error: null,

  setPermissions: (raw) => {
    const map = new Map<string, NormalizedPermission>();
    for (const entry of raw) {
      map.set(entry.module, {
        read:   entry.read   === 1,
        write:  entry.write  === 1,
        create: entry.create === 1,
        delete: entry.delete === 1,
        report: entry.report === 1,
        import: entry.import === 1,
        export: entry.export === 1,
      });
    }
    set({ permissions: map, isLoading: false, error: null });
  },

  setAdmin:   (isAdmin) => set({ isAdmin }),   
  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error) => set({ error, isLoading: false }),

  clearPermissions: () =>
    set({ permissions: new Map(), isLoading: false, isAdmin: false, error: null }),

 
  can: (module, action) => {
    if (get().isAdmin) return true;
    const perm = get().permissions.get(module);
    if (!perm) return false;
    return perm[action] === true;
  },

  canAccessModule: (module) => {
    if (get().isAdmin) return true;
    return get().can(module, "read");
  },

  canAccessAnyOf: (modules) => {
    if (get().isAdmin) return true;
    if (modules.length === 0) return true;
    return modules.some((mod) => get().can(mod, "read"));
  },
}));