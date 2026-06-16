import { useAuth } from "./useAuth";

export const usePermission = () => {
  const { user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin";

  return {
    isOwner,
    canAccessBilling: isOwner,
    canManageUsers: isOwner,
  };
};
