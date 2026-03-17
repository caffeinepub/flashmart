import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ShoppingBag, Store, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useApp } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const roleOptions = [
  {
    role: UserRole.customer,
    icon: ShoppingBag,
    title: "Customer",
    desc: "Order items from nearby stores.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary",
    screen: "customer-dashboard" as const,
  },
  {
    role: UserRole.store,
    icon: Store,
    title: "Store Vendor",
    desc: "Accept and fulfill local orders.",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    border: "border-chart-2",
    screen: "vendor-dashboard" as const,
  },
  {
    role: UserRole.deliveryP,
    icon: Truck,
    title: "Delivery Partner",
    desc: "Pick up and deliver orders.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    border: "border-chart-3",
    screen: "delivery-dashboard" as const,
  },
];

export default function RoleSelectionPage() {
  const { actor } = useActor();
  const { navigate, currentPhone, setCurrentUser } = useApp();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role.");
      return;
    }
    if (!actor) {
      toast.error("Not connected.");
      return;
    }
    setLoading(true);
    try {
      await actor.createUserProfile(
        currentPhone,
        name.trim() || "FlashMart User",
        selectedRole,
      );
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        setCurrentUser(profile);
        queryClient.setQueryData(["callerProfile"], profile);
      }
      const target =
        roleOptions.find((r) => r.role === selectedRole)?.screen ??
        "customer-dashboard";
      navigate(target);
      toast.success("Profile created! Welcome to FlashMart.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Choose Your Role
          </h1>
          <p className="text-sm text-foreground/70 font-medium mt-1">
            How will you use FlashMart?
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-xl shadow-card p-6 space-y-4"
          data-ocid="role.panel"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-foreground"
            >
              Your Name{" "}
              <span className="text-foreground/60 font-normal">(optional)</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-white text-foreground"
              data-ocid="role.name.input"
            />
          </div>

          {/* Role cards */}
          <div className="grid gap-3">
            {roleOptions.map((opt, i) => (
              <motion.button
                key={opt.role}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                onClick={() => setSelectedRole(opt.role)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedRole === opt.role
                    ? `${opt.border} bg-primary/5`
                    : "border-border hover:border-foreground/40"
                }`}
                data-ocid={`role.${opt.title.toLowerCase().replace(" ", "_")}.button`}
              >
                <div
                  className={`w-10 h-10 ${opt.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">
                    {opt.title}
                  </p>
                  <p className="text-xs text-foreground/70">{opt.desc}</p>
                </div>
                {selectedRole === opt.role && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
            data-ocid="role.continue.submit_button"
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
