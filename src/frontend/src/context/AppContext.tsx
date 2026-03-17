import { type ReactNode, createContext, useContext, useState } from "react";
import type { UserProfile } from "../backend";

export type AppScreen =
  | "landing"
  | "phone-login"
  | "otp-verify"
  | "role-selection"
  | "customer-dashboard"
  | "vendor-dashboard"
  | "delivery-dashboard"
  | "admin-panel";

interface AppContextType {
  screen: AppScreen;
  navigate: (screen: AppScreen) => void;
  currentPhone: string;
  setCurrentPhone: (phone: string) => void;
  demoOtp: string;
  setDemoOtp: (otp: string) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [currentPhone, setCurrentPhone] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  return (
    <AppContext.Provider
      value={{
        screen,
        navigate: setScreen,
        currentPhone,
        setCurrentPhone,
        demoOtp,
        setDemoOtp,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
