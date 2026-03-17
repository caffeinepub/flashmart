import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { type Order, OrderStatus } from "../backend";
import { useApp } from "../context/AppContext";
import { useOrdersByStatus, useUpdateOrderStatus } from "../hooks/useQueries";

export default function DeliveryDashboard() {
  const { currentUser } = useApp();
  const {
    data: confirmedOrders = [],
    isLoading: loadingConfirmed,
    refetch,
  } = useOrdersByStatus(OrderStatus.storeConfirmed);
  const { data: assignedOrders = [] } = useOrdersByStatus(
    OrderStatus.riderAssigned,
  );
  const { data: pickedOrders = [] } = useOrdersByStatus(OrderStatus.pickedUp);
  const updateStatus = useUpdateOrderStatus();

  const handleAcceptDelivery = async (order: Order) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: OrderStatus.riderAssigned,
      });
      toast.success(`Delivery accepted for "${order.itemName}"!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed.");
    }
  };

  const handleMarkPickedUp = async (order: Order) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: OrderStatus.pickedUp,
      });
      toast.success("Marked as picked up!");
    } catch (e: any) {
      toast.error(e?.message || "Failed.");
    }
  };

  const handleMarkDelivered = async (order: Order) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: OrderStatus.delivered,
      });
      toast.success("Order delivered! Great job 🎉");
    } catch (e: any) {
      toast.error(e?.message || "Failed.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Delivery Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentUser?.name || "Delivery Partner"} · Find and deliver orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5"
          data-ocid="delivery.refresh.button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Available to Accept */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Available Deliveries ({confirmedOrders.length})
        </h2>
        {loadingConfirmed ? (
          <div
            className="flex items-center gap-2 text-muted-foreground text-sm py-4"
            data-ocid="delivery.available.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : confirmedOrders.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground text-sm bg-muted/50 rounded-xl"
            data-ocid="delivery.available.empty_state"
          >
            No deliveries available right now.
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedOrders.map((order, i) => (
              <motion.div
                key={order.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                data-ocid={`delivery.available.item.${i + 1}`}
              >
                <Card className="shadow-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">
                          {order.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Order #{order.id.toString()}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1.5 text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Store Confirmed
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptDelivery(order)}
                      disabled={updateStatus.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs"
                      data-ocid={`delivery.accept.button.${i + 1}`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Accept Delivery
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned (heading to store) */}
      {assignedOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" />
            Assigned — Navigate to Store ({assignedOrders.length})
          </h2>
          <div className="space-y-3">
            {assignedOrders.map((order, i) => (
              <Card
                key={order.id.toString()}
                className="shadow-card border-purple-200"
                data-ocid={`delivery.assigned.item.${i + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        {order.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order #{order.id.toString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMarkPickedUp(order)}
                    disabled={updateStatus.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs"
                    data-ocid={`delivery.pickup.button.${i + 1}`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Mark as Picked Up
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Picked up - en route */}
      {pickedOrders.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-600" />
            En Route — Deliver Now ({pickedOrders.length})
          </h2>
          <div className="space-y-3">
            {pickedOrders.map((order, i) => (
              <Card
                key={order.id.toString()}
                className="shadow-card border-orange-200"
                data-ocid={`delivery.enroute.item.${i + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        {order.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order #{order.id.toString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMarkDelivered(order)}
                    disabled={updateStatus.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-1.5 text-xs"
                    data-ocid={`delivery.delivered.button.${i + 1}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark as Delivered
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
