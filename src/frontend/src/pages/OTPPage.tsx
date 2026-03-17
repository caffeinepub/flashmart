import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useQueryClient } from "@tanstack/react-query";
import { Info, RotateCcw, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useApp } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

function roleToScreen(role: UserRole) {
  switch (role) {
    case UserRole.customer:
      return "customer-dashboard" as const;
    case UserRole.store:
      return "vendor-dashboard" as const;
    case UserRole.deliveryP:
      return "delivery-dashboard" as const;
    case UserRole.admin:
      return "admin-panel" as const;
    default:
      return "customer-dashboard" as const;
  }
}

export default function OTPPage() {
  const { actor } = useActor();
  const { navigate, currentPhone, demoOtp, setDemoOtp, setCurrentUser } =
    useApp();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }
    setOtpError("");
    if (!actor) {
      toast.error("Not connected.");
      return;
    }
    setLoading(true);
    try {
      const valid = await actor.verifyOtp(currentPhone, otp);
      if (!valid) {
        setOtpError("Incorrect OTP. Please try again.");
        return;
      }
      // Check if new user
      const isNew = await actor.isNewUser(currentPhone);
      if (isNew) {
        navigate("role-selection");
      } else {
        const profile = await actor.getCallerUserProfile();
        if (profile) {
          setCurrentUser(profile);
          queryClient.setQueryData(["callerProfile"], profile);
          navigate(roleToScreen(profile.role));
        } else {
          navigate("role-selection");
        }
      }
      toast.success("Verified successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!actor || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const newOtp = await actor.generateOtp(currentPhone);
      setDemoOtp(newOtp);
      setResendCooldown(60);
      timerRef.current = setInterval(() => {
        setResendCooldown((v) => {
          if (v <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
      toast.success("OTP resent!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to resend.");
    } finally {
      setResendLoading(false);
    }
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
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verify OTP</h1>
          <p className="text-sm text-foreground/70 font-medium mt-1">
            Code sent to{" "}
            <span className="font-bold text-foreground">
              {currentPhone || "your number"}
            </span>
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-xl shadow-card p-6 space-y-5"
          data-ocid="otp.panel"
        >
          {demoOtp && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800">
                  Demo OTP (for testing):
                </p>
                <p className="text-lg font-mono font-bold text-blue-900 tracking-widest">
                  {demoOtp}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setOtpError("");
              }}
              data-ocid="otp.input"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {otpError && (
              <p
                className="text-xs text-destructive font-semibold"
                data-ocid="otp.error_state"
              >
                {otpError}
              </p>
            )}
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
            data-ocid="otp.verify.button"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="flex items-center gap-1 text-xs font-semibold text-primary disabled:text-foreground/40 disabled:cursor-not-allowed hover:underline"
              data-ocid="otp.resend.button"
            >
              <RotateCcw className="w-3 h-3" />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("phone-login")}
            className="block w-full text-center text-xs font-medium text-foreground/60 hover:text-foreground"
            data-ocid="otp.back.link"
          >
            ← Change phone number
          </button>
        </div>
      </motion.div>
    </div>
  );
}
