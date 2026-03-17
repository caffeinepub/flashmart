import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Phone, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s/g, "");
  if (!cleaned) return "Phone number is required.";
  const digits = cleaned.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return "Enter a valid phone number (digits only).";
  if (digits.length < 7 || digits.length > 15)
    return "Phone number must be 7–15 digits.";
  return null;
}

export default function LoginPage() {
  const { actor } = useActor();
  const { navigate, setCurrentPhone, setDemoOtp } = useApp();
  const [phone, setPhone] = useState("+91");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentOtp, setSentOtp] = useState("");

  const handleSendOTP = async () => {
    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError("");
    if (!actor) {
      toast.error("Not connected to backend. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const otp = await actor.generateOtp(phone.trim());
      setSentOtp(otp);
      setDemoOtp(otp);
      setCurrentPhone(phone.trim());
      toast.success("OTP sent! Check the demo box below.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate("otp-verify");
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to FlashMart
          </h1>
          <p className="text-sm text-foreground/70 font-medium mt-1">
            Enter your phone number to continue
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-xl shadow-card p-6 space-y-4"
          data-ocid="login.panel"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-sm font-semibold text-foreground"
            >
              Mobile Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError("");
                }}
                className="pl-9 border-border bg-white text-foreground"
                data-ocid="login.phone.input"
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
              />
            </div>
            {phoneError && (
              <p
                className="text-xs text-destructive font-medium"
                data-ocid="login.phone_error"
              >
                {phoneError}
              </p>
            )}
          </div>

          <Button
            onClick={handleSendOTP}
            disabled={loading || !actor}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
            data-ocid="login.send_otp.button"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

          {sentOtp && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2"
              data-ocid="login.demo_otp.panel"
            >
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800">
                  Demo OTP (for testing):
                </p>
                <p className="text-lg font-mono font-bold text-blue-900 tracking-widest">
                  {sentOtp}
                </p>
              </div>
            </motion.div>
          )}

          {sentOtp && (
            <Button
              onClick={handleProceed}
              variant="outline"
              className="w-full border-2 border-border font-semibold text-foreground"
              data-ocid="login.proceed.button"
            >
              Enter OTP →
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
