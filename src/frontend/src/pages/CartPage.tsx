import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import { useLocation } from "../hooks/useLocation";
import { useCreateOrder } from "../hooks/useQueries";

export default function CartPage() {
  const { items, increaseQty, decreaseQty, removeItem, clearCart, totalPrice } =
    useCart();
  const { navigate } = useApp();
  const createOrder = useCreateOrder();
  const { status } = useLocation();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    action: (() => void) | null;
  }>({ open: false, message: "", action: null });

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    if (status !== "in_range") return;
    const summary = items.map((i) => `${i.name} x${i.quantity}`).join(", ");
    setConfirmModal({
      open: true,
      message: `Place order for: ${summary}?`,
      action: async () => {
        try {
          for (const item of items) {
            const label =
              item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
            await createOrder.mutateAsync(label);
          }
          clearCart();
          toast.success("Order placed successfully!");
          navigate("customer-dashboard");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Failed to place order.";
          toast.error(msg);
        }
      },
    });
  };

  const locationBanner = () => {
    if (status === "in_range") {
      return (
        <div className="mb-3" data-ocid="cart.location_indicator">
          <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
            <MapPin className="w-4 h-4" />✅ Inside Delivery Zone
          </div>
          <p className="text-xs text-green-600 mt-0.5 pl-5">
            You are inside the delivery zone. You can place your order.
          </p>
        </div>
      );
    }
    if (status === "out_of_range") {
      return (
        <div className="mb-3" data-ocid="cart.location_indicator">
          <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
            <MapPin className="w-4 h-4" />❌ Outside Delivery Zone
          </div>
          <p className="text-xs text-red-500 mt-0.5 pl-5">
            Your location is outside our delivery zone. Orders are not available
            here.
          </p>
        </div>
      );
    }
    if (status === "denied") {
      return (
        <div className="mb-3" data-ocid="cart.location_indicator">
          <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
            <MapPin className="w-4 h-4" />
            Location: Not Enabled
          </div>
          <p className="text-xs text-red-500 mt-0.5 pl-5">
            Go back to dashboard to enable location
          </p>
        </div>
      );
    }
    if (status === "requesting") {
      return (
        <div className="mb-3" data-ocid="cart.location_indicator">
          <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm">
            <MapPin className="w-4 h-4" />
            Location: Checking...
          </div>
        </div>
      );
    }
    // idle
    return (
      <div className="mb-3" data-ocid="cart.location_indicator">
        <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm">
          <MapPin className="w-4 h-4" />
          Location not enabled
        </div>
        <p className="text-xs text-gray-500 mt-0.5 pl-5">
          Go back to dashboard to enable location before placing order
        </p>
      </div>
    );
  };

  const canOrder = status === "in_range";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.action?.();
          setConfirmModal({ open: false, message: "", action: null });
        }}
        onCancel={() =>
          setConfirmModal({ open: false, message: "", action: null })
        }
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("customer-dashboard")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-green-500" />
          Your Cart
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">Your cart is empty</p>
          <p className="text-sm mt-1">
            Add items from the shop to get started.
          </p>
          <Button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold"
            onClick={() => navigate("customer-dashboard")}
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className="border border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ₹{item.price} each
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decreaseQty(item.id)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center font-extrabold text-gray-900 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQty(item.id)}
                            className="w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white font-bold transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[52px]">
                          <p className="font-extrabold text-gray-900 text-sm">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors ml-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-extrabold text-green-700 text-lg">
              ₹{totalPrice}
            </span>
          </div>

          {/* Location Banner */}
          {locationBanner()}

          <Button
            onClick={handlePlaceOrder}
            disabled={createOrder.isPending || !canOrder}
            data-ocid="cart.submit_button"
            className={`w-full h-12 text-base font-extrabold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow ${
              !canOrder ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {createOrder.isPending ? "Placing Order..." : "Place Order"}
          </Button>
        </>
      )}
    </div>
  );
}
