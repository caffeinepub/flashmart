import { useState } from "react";
import PasswordModal from "./PasswordModal";

type DashboardRole = "vendor" | "delivery";

const ACCESS_KEYS: Record<DashboardRole, string> = {
  vendor: "vendorAccess",
  delivery: "deliveryAccess",
};

interface ProtectedRouteProps {
  dashboardRole: DashboardRole;
  onCancel: () => void;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  dashboardRole,
  onCancel,
  children,
}: ProtectedRouteProps) {
  const key = ACCESS_KEYS[dashboardRole];
  const [hasAccess, setHasAccess] = useState(
    () => localStorage.getItem(key) === "true",
  );

  const handleSuccess = () => {
    localStorage.setItem(key, "true");
    setHasAccess(true);
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <PasswordModal
      dashboardRole={dashboardRole}
      onSuccess={handleSuccess}
      onCancel={onCancel}
    />
  );
}
