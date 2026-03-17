import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Order, OrderStatus } from "../backend";
import { useApp } from "../context/AppContext";
import { useCreateOrder, useMyOrders } from "../hooks/useQueries";

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  [OrderStatus.requested]: {
    label: "Requested",
    color: "bg-warning/15 text-warning-foreground border-warning/30",
    icon: Clock,
  },
  [OrderStatus.storeConfirmed]: {
    label: "Store Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: CheckCircle2,
  },
  [OrderStatus.riderAssigned]: {
    label: "Rider Assigned",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: Truck,
  },
  [OrderStatus.pickedUp]: {
    label: "Picked Up",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: Package,
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: CheckCircle2,
  },
};

function OrderCard({ order, idx }: { order: Order; idx: number }) {
  const cfg = statusConfig[order.status];
  const Icon = cfg.icon;
  const date = new Date(Number(order.createdAt) / 1_000_000).toLocaleString();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl shadow-card"
      data-ocid={`orders.item.${idx + 1}`}
    >
      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <ShoppingBag className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground truncate">
          {order.itemName}
        </p>
        <p className="text-xs text-foreground/60 mt-0.5">{date}</p>
      </div>
      <Badge
        variant="outline"
        className={`text-xs flex-shrink-0 gap-1 font-semibold ${cfg.color}`}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const { currentUser } = useApp();
  const customerId = currentUser?.id?.toString();
  const { data: orders = [], isLoading } = useMyOrders(customerId);
  const createOrder = useCreateOrder();
  const [itemName, setItemName] = useState("");
  const [itemError, setItemError] = useState("");
  const [lastCreated, setLastCreated] = useState("");

  const handleRequest = async () => {
    if (!itemName.trim()) {
      setItemError("Please enter an item name.");
      return;
    }
    if (itemName.trim().length > 100) {
      setItemError("Item name too long (max 100 chars).");
      return;
    }
    setItemError("");
    try {
      await createOrder.mutateAsync(itemName.trim());
      setLastCreated(itemName.trim());
      setItemName("");
      toast.success("Order placed successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to place order.");
    }
  };

  const activeOrders = orders.filter((o) => o.status !== OrderStatus.delivered);
  const completedOrders = orders.filter(
    (o) => o.status === OrderStatus.delivered,
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Hello, {currentUser?.name || "Customer"} 👋
        </h1>
        <p className="text-sm text-foreground/70 font-medium">
          What do you need today?
        </p>
      </div>

      {/* Order Input */}
      <Card className="mb-6 shadow-card border-border" data-ocid="order.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Request an Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label
              htmlFor="item"
              className="text-sm font-semibold text-foreground"
            >
              What item do you need?
            </Label>
            <Input
              id="item"
              placeholder="e.g. 1kg onions, Paracetamol 500mg, Phone charger..."
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setItemError("");
              }}
              className="mt-1.5 border-border bg-white text-foreground"
              data-ocid="order.item.input"
              onKeyDown={(e) => e.key === "Enter" && handleRequest()}
              maxLength={100}
            />
            {itemError && (
              <p
                className="text-xs text-destructive font-semibold mt-1"
                data-ocid="order.item_error"
              >
                {itemError}
              </p>
            )}
          </div>
          <Button
            onClick={handleRequest}
            disabled={createOrder.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
            data-ocid="order.request.primary_button"
          >
            {createOrder.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Request Item"
            )}
          </Button>

          <AnimatePresence>
            {lastCreated && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2"
                data-ocid="order.success_state"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-primary font-semibold">
                  Order placed for &ldquo;{lastCreated}&rdquo;!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Active Orders */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Active Orders ({activeOrders.length})
        </h2>
        {isLoading ? (
          <div
            className="flex items-center gap-2 text-foreground/60 text-sm py-4"
            data-ocid="orders.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
          </div>
        ) : activeOrders.length === 0 ? (
          <div
            className="text-center py-8 text-foreground/60 text-sm font-medium bg-muted/50 rounded-xl"
            data-ocid="orders.empty_state"
          >
            No active orders. Request something above!
          </div>
        ) : (
          <div className="space-y-2">
            {activeOrders.map((o, i) => (
              <OrderCard key={o.id.toString()} order={o} idx={i} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Completed Orders ({completedOrders.length})
          </h2>
          <div className="space-y-2">
            {completedOrders.map((o, i) => (
              <OrderCard key={o.id.toString()} order={o} idx={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
