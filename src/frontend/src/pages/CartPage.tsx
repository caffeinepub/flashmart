import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";
import MapPickerModal from "../components/MapPickerModal";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import { useCreateOrder } from "../hooks/useQueries";

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}

// Delivery zone polygon
const DELIVERY_ZONE = [
  { lat: 17.3448, lng: 78.5458 },
  { lat: 17.3462, lng: 78.5595 },
  { lat: 17.3368, lng: 78.5708 },
  { lat: 17.332, lng: 78.5602 },
  { lat: 17.3365, lng: 78.5472 },
];

/**
 * Ray-casting point-in-polygon algorithm.
 * Polygon is automatically closed.
 */
function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: { lat: number; lng: number }[],
): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function CartPage() {
  const { items, increaseQty, decreaseQty, removeItem, clearCart, totalPrice } =
    useCart();
  const { navigate } = useApp();
  const createOrder = useCreateOrder();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    action: (() => void) | null;
  }>({ open: false, message: "", action: null });
  const [mapOpen, setMapOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [customer, setCustomer] = useState<CustomerDetails>(() => {
    try {
      const saved = localStorage.getItem("flashmart_customer");
      return saved ? JSON.parse(saved) : { name: "", phone: "", address: "" };
    } catch {
      return { name: "", phone: "", address: "" };
    }
  });
  const [formErrors, setFormErrors] = useState<
    Partial<CustomerDetails & { pin: string }>
  >({});

  // Check pinned location against delivery zone (ISSUE 3 FIX)
  const zoneStatus = useMemo(() => {
    if (!pinnedLocation) return "no_pin";
    const inside = isPointInPolygon(
      pinnedLocation.lat,
      pinnedLocation.lng,
      DELIVERY_ZONE,
    );
    return inside ? "in_range" : "out_of_range";
  }, [pinnedLocation]);

  const canOrder = zoneStatus === "in_range";

  const handleFieldChange = (field: keyof CustomerDetails, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CustomerDetails & { pin: string }> = {};
    if (!customer.name.trim()) errors.name = "Name is required";
    if (!customer.phone.trim()) errors.phone = "Phone number is required";
    if (!customer.address.trim()) errors.address = "Address is required";
    if (!pinnedLocation)
      errors.pin = "Please pin your delivery location on the map";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePinConfirm = (lat: number, lng: number) => {
    setPinnedLocation({ lat, lng });
    setMapOpen(false);
    setFormErrors((prev) => ({ ...prev, pin: undefined }));
    // Notify user about zone status after pinning
    const inside = isPointInPolygon(lat, lng, DELIVERY_ZONE);
    if (inside) {
      toast.success("Location pinned! Delivery available ✅");
    } else {
      toast.error("Location outside delivery zone ❌");
    }
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    if (!validateForm()) {
      toast.error("Please fill in all details and pin your location.");
      return;
    }
    if (!canOrder) {
      toast.error("Your pinned location is outside the delivery zone.");
      return;
    }
    const summary = items.map((i) => `${i.name} x${i.quantity}`).join(", ");
    setConfirmModal({
      open: true,
      message: `Place order for: ${summary}?`,
      action: async () => {
        try {
          localStorage.setItem("flashmart_customer", JSON.stringify(customer));
          const orderPayload = JSON.stringify({
            customerName: customer.name.trim(),
            customerPhone: customer.phone.trim(),
            customerAddress: customer.address.trim(),
            pinnedLatitude: pinnedLocation!.lat,
            pinnedLongitude: pinnedLocation!.lng,
            items: summary,
          });
          await createOrder.mutateAsync(orderPayload);
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

  const zoneBanner = () => {
    if (zoneStatus === "in_range") {
      return (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              ✅ Delivery Available — Inside Delivery Zone
            </span>
          </div>
        </div>
      );
    }
    if (zoneStatus === "out_of_range") {
      return (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">
              ❌ Outside delivery zone — change pin location
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-500">
            Pin your delivery location to check availability
          </span>
        </div>
      </div>
    );
  };

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

      <MapPickerModal
        open={mapOpen}
        initialLat={pinnedLocation?.lat}
        initialLng={pinnedLocation?.lng}
        onConfirm={handlePinConfirm}
        onClose={() => setMapOpen(false)}
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
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-extrabold text-green-700 text-lg">
              ₹{totalPrice}
            </span>
          </div>

          {/* Customer Details Form */}
          <div className="mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-green-500" />
              Delivery Details
            </h2>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  placeholder="Enter your name"
                  value={customer.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    formErrors.name
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="customer-phone"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={customer.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    formErrors.phone
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="customer-address"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="customer-address"
                  placeholder="Enter your full delivery address"
                  value={customer.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  rows={3}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${
                    formErrors.address
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
                {formErrors.address && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.address}
                  </p>
                )}
              </div>

              {/* Pin Location */}
              <div>
                <p className="block text-xs font-bold text-gray-700 mb-1">
                  Pinned Location <span className="text-red-500">*</span>
                </p>
                {pinnedLocation ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700 font-semibold">
                        Selected: {pinnedLocation.lat.toFixed(5)},{" "}
                        {pinnedLocation.lng.toFixed(5)}
                      </span>
                    </div>
                    {/* Mini map preview */}
                    <div
                      className="rounded-lg overflow-hidden border border-gray-200"
                      style={{ height: 140 }}
                    >
                      <iframe
                        title="Pinned location preview"
                        width="100%"
                        height="140"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${pinnedLocation.lng - 0.005},${pinnedLocation.lat - 0.005},${pinnedLocation.lng + 0.005},${pinnedLocation.lat + 0.005}&layer=mapnik&marker=${pinnedLocation.lat},${pinnedLocation.lng}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="w-full text-xs font-bold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
                    >
                      Change Location
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="w-full h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 justify-center"
                    >
                      <Navigation className="w-4 h-4" />
                      Pin Location on Map
                    </Button>
                    {formErrors.pin && (
                      <p className="text-xs text-red-500">{formErrors.pin}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Zone Banner */}
          {zoneBanner()}

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
