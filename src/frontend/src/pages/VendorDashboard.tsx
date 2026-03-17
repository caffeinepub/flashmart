import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Order, OrderStatus } from "../backend";
import { useApp } from "../context/AppContext";
import { useOrdersByStatus, useUpdateOrderStatus } from "../hooks/useQueries";

export default function VendorDashboard() {
  const { currentUser } = useApp();
  const {
    data: requestedOrders = [],
    isLoading,
    refetch,
  } = useOrdersByStatus(OrderStatus.requested);
  const { data: confirmedOrders = [] } = useOrdersByStatus(
    OrderStatus.storeConfirmed,
  );
  const updateStatus = useUpdateOrderStatus();
  const [declining, setDeclining] = useState<Set<string>>(new Set());

  const handleAccept = async (order: Order) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: OrderStatus.storeConfirmed,
      });
      toast.success(`Order for "${order.itemName}" accepted!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept order.");
    }
  };

  const handleDecline = (order: Order) => {
    setDeclining((prev) => new Set([...prev, order.id.toString()]));
    toast.info(`Order for "${order.itemName}" declined.`);
  };

  const visibleRequested = requestedOrders.filter(
    (o) => !declining.has(o.id.toString()),
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Vendor Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentUser?.name || "Store Vendor"} · Manage incoming orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5"
          data-ocid="vendor.refresh.button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Incoming Orders */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Incoming Requests ({visibleRequested.length})
        </h2>

        {isLoading ? (
          <div
            className="flex items-center gap-2 text-muted-foreground text-sm py-4"
            data-ocid="vendor.orders.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
          </div>
        ) : visibleRequested.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground text-sm bg-muted/50 rounded-xl"
            data-ocid="vendor.orders.empty_state"
          >
            No pending orders. Check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRequested.map((order, i) => (
              <motion.div
                key={order.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.05 * i }}
                data-ocid={`vendor.orders.item.${i + 1}`}
              >
                <Card className="shadow-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {order.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Order #{order.id.toString()} ·{" "}
                          {new Date(
                            Number(order.createdAt) / 1_000_000,
                          ).toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1.5 text-xs bg-warning/10 text-warning border-warning/20"
                        >
                          Awaiting confirmation
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(order)}
                        disabled={updateStatus.isPending}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs"
                        data-ocid={`vendor.accept.button.${i + 1}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(order)}
                        className="flex-1 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/5"
                        data-ocid={`vendor.decline.button.${i + 1}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Orders */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Confirmed Orders ({confirmedOrders.length})
        </h2>
        {confirmedOrders.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm bg-muted/50 rounded-xl"
            data-ocid="vendor.confirmed.empty_state"
          >
            No confirmed orders yet.
          </div>
        ) : (
          <div className="space-y-2">
            {confirmedOrders.map((order, i) => (
              <div
                key={order.id.toString()}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                data-ocid={`vendor.confirmed.item.${i + 1}`}
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {order.itemName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{order.id.toString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  Confirmed
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
