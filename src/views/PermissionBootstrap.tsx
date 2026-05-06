import { useAuth } from "../context/AuthContext";
import { useBootPermissions } from "../hooks/permission/useBootPermission";

export const PermissionBootstrap: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  useBootPermissions(
    user?.roles       ?? null,
    user?.permissions ?? null,
    authLoading,
  );

  return null;
};