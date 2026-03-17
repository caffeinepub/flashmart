import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { UserRole } from "./backend";
import { AppProvider, type AppScreen, useApp } from "./context/AppContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";

import Footer from "./components/Footer";
import Header from "./components/Header";
import AdminPanel from "./pages/AdminPanel";
import CustomerDashboard from "./pages/CustomerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OTPPage from "./pages/OTPPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import VendorDashboard from "./pages/VendorDashboard";

const AUTH_SCREENS: AppScreen[] = [
  "phone-login",
  "otp-verify",
  "role-selection",
];
const DASHBOARD_SCREENS: AppScreen[] = [
  "customer-dashboard",
  "vendor-dashboard",
  "delivery-dashboard",
  "admin-panel",
];

function roleToScreen(role: UserRole): AppScreen {
  switch (role) {
    case UserRole.customer:
      return "customer-dashboard";
    case UserRole.store:
      return "vendor-dashboard";
    case UserRole.deliveryP:
      return "delivery-dashboard";
    case UserRole.admin:
      return "admin-panel";
    default:
      return "customer-dashboard";
  }
}

function AppContent() {
  const { identity, clear } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { screen, navigate, setCurrentUser } = useApp();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isFetched: profileFetched,
    isLoading: profileLoading,
  } = useCallerProfile();

  const isAuthenticated = !!identity;

  // Auto-route when identity/profile changes
  useEffect(() => {
    if (actorFetching) return;

    if (!isAuthenticated) {
      if (DASHBOARD_SCREENS.includes(screen) || AUTH_SCREENS.includes(screen)) {
        navigate("landing");
      }
      return;
    }

    // ICP-authenticated
    if (!profileFetched || profileLoading) return;

    if (userProfile === null || userProfile === undefined) {
      // No profile → phone login flow
      if (!AUTH_SCREENS.includes(screen)) {
        navigate("phone-login");
      }
    } else {
      setCurrentUser(userProfile);
      // Has profile → route to dashboard if not already there
      if (!DASHBOARD_SCREENS.includes(screen)) {
        navigate(roleToScreen(userProfile.role));
      }
    }
  }, [
    isAuthenticated,
    userProfile,
    profileFetched,
    profileLoading,
    actorFetching,
    screen,
    navigate,
    setCurrentUser,
  ]);

  const handleLogout = useCallback(async () => {
    await clear();
    queryClient.clear();
    setCurrentUser(null);
    navigate("landing");
  }, [clear, queryClient, setCurrentUser, navigate]);

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return <LandingPage />;
      case "phone-login":
        return <LoginPage />;
      case "otp-verify":
        return <OTPPage />;
      case "role-selection":
        return <RoleSelectionPage />;
      case "customer-dashboard":
        return <CustomerDashboard />;
      case "vendor-dashboard":
        return <VendorDashboard />;
      case "delivery-dashboard":
        return <DeliveryDashboard />;
      case "admin-panel":
        return <AdminPanel />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onLogout={handleLogout} />
      <main className="flex-1">{renderScreen()}</main>
      <Footer />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
