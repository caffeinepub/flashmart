import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { UserRole } from "./backend";
import { AppProvider, type AppScreen, useApp } from "./context/AppContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";

import Footer from "./components/Footer";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import CartPage from "./pages/CartPage";
import CreateStorePage from "./pages/CreateStorePage";
import CustomerDashboard from "./pages/CustomerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import GlobalSearchPage from "./pages/GlobalSearchPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OTPPage from "./pages/OTPPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import StoreListPage from "./pages/StoreListPage";
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
  "cart",
  "store-list",
  "store-detail",
  "create-store",
  "global-search",
  "order-tracking",
];

function roleToScreen(role: UserRole): AppScreen {
  switch (role) {
    case UserRole.customer:
      return "customer-dashboard";
    case UserRole.store:
      return "vendor-dashboard";
    case UserRole.deliveryP:
      return "delivery-dashboard";
    default:
      return "customer-dashboard";
  }
}

function AppContent() {
  const { identity, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { screen, navigate, setCurrentUser } = useApp();
  const queryClient = useQueryClient();
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    data: userProfile,
    isFetched: profileFetched,
    isLoading: profileLoading,
  } = useCallerProfile();

  const isAuthenticated = !!identity;

  // Keep-alive: ping the canister every 90 seconds to prevent it from stopping
  useEffect(() => {
    if (!actor) return;

    const ping = () => {
      actor.getAllStores().catch(() => {
        // silent - just keeping the canister warm
      });
    };

    // Ping immediately on actor ready
    ping();

    keepAliveRef.current = setInterval(ping, 90_000);

    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [actor]);

  useEffect(() => {
    if (actorFetching) return;

    if (!isAuthenticated) {
      if (DASHBOARD_SCREENS.includes(screen) || AUTH_SCREENS.includes(screen)) {
        navigate("landing");
      }
      return;
    }

    if (!profileFetched || profileLoading) return;

    if (userProfile === null || userProfile === undefined) {
      if (!AUTH_SCREENS.includes(screen)) {
        navigate("phone-login");
      }
    } else {
      setCurrentUser(userProfile);
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
      case "cart":
        return <CartPage />;
      case "store-list":
        return <StoreListPage />;
      case "store-detail":
        return <StoreDetailPage />;
      case "order-tracking":
        return <OrderTrackingPage />;
      case "create-store":
        return (
          <ProtectedRoute
            dashboardRole="vendor"
            onCancel={() => navigate("landing")}
          >
            <CreateStorePage />
          </ProtectedRoute>
        );
      case "vendor-dashboard":
        return (
          <ProtectedRoute
            dashboardRole="vendor"
            onCancel={() => navigate("landing")}
          >
            <VendorDashboard />
          </ProtectedRoute>
        );
      case "delivery-dashboard":
        return (
          <ProtectedRoute
            dashboardRole="delivery"
            onCancel={() => navigate("landing")}
          >
            <DeliveryDashboard />
          </ProtectedRoute>
        );
      case "global-search":
        return <GlobalSearchPage />;
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
    <NotificationProvider>
      <AppProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AppProvider>
    </NotificationProvider>
  );
}
