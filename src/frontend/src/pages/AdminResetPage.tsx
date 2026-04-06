import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const ADMIN_PASSWORD = "FLASHMART007";

interface ResetLogEntry {
  timestamp: bigint;
  caller: { toText(): string };
}

function useGetResetLogs() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<ResetLogEntry[]>({
    queryKey: ["resetLogs"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getResetLogs();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30_000,
  });
}

function useResetAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adminPassword: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).resetAllData(adminPassword) as Promise<string>;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1_000_000n);
    return new Date(ms).toLocaleString();
  } catch {
    return "Unknown";
  }
}

export default function AdminResetPage() {
  const { navigate } = useApp();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [validationError, setValidationError] = useState("");
  const { data: resetLogs } = useGetResetLogs();
  const resetMutation = useResetAllData();

  const lastLog =
    resetLogs && resetLogs.length > 0
      ? [...resetLogs].sort((a, b) => Number(b.timestamp - a.timestamp))[0]
      : null;

  const isFormFilled =
    password.trim().length > 0 && confirmText.trim().length > 0;
  const isPending = resetMutation.isPending;

  const handleReset = async () => {
    // Clear previous validation error
    setValidationError("");

    // Step 1: Validate both fields client-side
    const passwordCorrect = password.trim() === ADMIN_PASSWORD;
    const confirmCorrect = confirmText.trim() === "RESET";

    if (!passwordCorrect || !confirmCorrect) {
      setValidationError("Invalid admin credentials");
      return;
    }

    // Step 2: Call backend reset
    try {
      const result = await resetMutation.mutateAsync(password.trim());
      console.log("[AdminReset] Result:", result);
      toast.success("App data reset successful");
      localStorage.clear();
      navigate("landing");
    } catch (err: unknown) {
      console.error("[AdminReset] Error:", err);
      setValidationError("Reset failed: backend error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              FlashMart Admin
            </h1>
            <p className="text-xs text-muted-foreground">Reset Data Control</p>
          </div>
        </div>

        {/* Danger Warning */}
        <div
          className="border-2 border-destructive rounded-xl p-4 mb-6 bg-destructive/5"
          data-ocid="admin.reset.dialog"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-destructive text-sm">
                ⚠️ This will delete ALL app data permanently
              </p>
              <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
                All users, stores, products, orders, delivery data, and
                notifications will be erased. This action cannot be undone. The
                app will reset to a fresh install state.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Confirm Reset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Admin Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-password"
                className="text-sm font-medium text-foreground"
              >
                Admin Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError("");
                }}
                disabled={isPending}
                autoComplete="off"
                data-ocid="admin.reset.input"
              />
            </div>

            {/* Confirmation Text */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-text"
                className="text-sm font-medium text-foreground"
              >
                Type{" "}
                <span className="font-mono font-bold text-destructive">
                  RESET
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-text"
                type="text"
                placeholder="Type RESET here"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setValidationError("");
                }}
                disabled={isPending}
                autoComplete="off"
                data-ocid="admin.reset.textarea"
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div
                className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3"
                data-ocid="admin.reset.error_state"
              >
                <p className="text-sm font-semibold text-destructive">
                  {validationError}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <Button
                onClick={handleReset}
                disabled={!isFormFilled || isPending}
                className="w-full bg-destructive hover:bg-destructive/90 text-white font-semibold"
                data-ocid="admin.reset.delete_button"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset All Data"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("landing")}
                disabled={isPending}
                className="w-full"
                data-ocid="admin.reset.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Reset Log */}
        {lastLog && (
          <div className="mt-5 rounded-lg bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Last reset:{" "}
              <span className="font-medium text-foreground">
                {formatTimestamp(lastLog.timestamp)}
              </span>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Authorised personnel only.
        </p>
      </div>
    </div>
  );
}
