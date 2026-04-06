import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, ShoppingBag, Store, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useApp } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

export default function RoleSelectionPage() {
  const { actor } = useActor();
  const { navigate, currentPhone, setCurrentUser } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminMsg, setShowAdminMsg] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!actor) {
      toast.error("Not connected.");
      return;
    }
    setLoading(true);
    try {
      await actor.createUserProfile(
        currentPhone,
        name.trim() || "Riva User",
        UserRole.customer,
      );
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        setCurrentUser(profile);
        queryClient.setQueryData(["callerProfile"], profile);
      }
      navigate("customer-dashboard");
      toast.success("Profile created! Welcome to Riva.");
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
            How will you use Riva?
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-6 space-y-4">
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
            />
          </div>

          {/* Customer — selectable */}
          <div className="grid gap-3">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0 }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 text-left"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Customer</p>
                <p className="text-xs text-foreground/70">
                  Order items from nearby stores.
                </p>
              </div>
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  role="img"
                  aria-label="Selected"
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Store Vendor — locked */}
            {(
              [
                {
                  icon: Store,
                  title: "Store Vendor",
                  desc: "Accept and fulfill local orders.",
                  color: "text-chart-2",
                  bg: "bg-chart-2/10",
                },
                {
                  icon: Truck,
                  title: "Delivery Partner",
                  desc: "Pick up and deliver orders.",
                  color: "text-chart-3",
                  bg: "bg-chart-3/10",
                },
              ] as const
            ).map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * (i + 1) }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdminMsg(opt.title)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-muted/30 text-left opacity-75 cursor-pointer hover:bg-muted/50 transition-all"
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
                  <Lock className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                </button>

                {showAdminMsg === opt.title && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center"
                  >
                    🔒 Access will be granted by admin
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            {loading ? "Setting up..." : "Continue as Customer"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
