import { useAuth } from "./useAuth";

export const usePermission = () => {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  return {
    isOwner,
    canAccessBilling: isOwner,
    canManageUsers: isOwner,
  };
};
