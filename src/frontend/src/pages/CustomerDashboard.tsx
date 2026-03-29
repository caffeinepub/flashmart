import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Order, OrderStatus, type Product } from "../backend";
import ConfirmModal from "../components/ConfirmModal";
import LocationModal from "../components/LocationModal";
import OutOfRangeModal from "../components/OutOfRangeModal";
import SmartSearchBar from "../components/SmartSearchBar";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { useLocation } from "../hooks/useLocation";
import {
  useAllProducts,
  useCreateOrder,
  useMyOrders,
} from "../hooks/useQueries";
import { filterAndRankProducts } from "../utils/searchUtils";

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

function ProductCard({
  product,
  idx,
  onAddToCart,
  cartQty,
}: {
  product: Product;
  idx: number;
  onAddToCart: (product: Product) => void;
  cartQty: number;
}) {
  const imgSrc =
    product.image && product.image.trim() !== ""
      ? product.image
      : `https://picsum.photos/seed/${product.productId}/200/140`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * idx, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
      data-ocid={`products.item.${idx + 1}`}
    >
      <div className="relative">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-28 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://picsum.photos/seed/${product.productId}/200/140`;
          }}
        />
        {cartQty > 0 && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-600 text-white text-[10px] font-extrabold rounded-full shadow">
              {cartQty}
            </span>
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <p className="font-bold text-sm text-gray-900 leading-tight truncate">
          {product.name}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight line-clamp-1">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-extrabold text-sm text-gray-900">
            ₹{product.price}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => onAddToCart(product)}
          className="mt-2 w-full h-7 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white border-0"
          data-ocid={`products.item.${idx + 1}.button`}
        >
          {cartQty > 0 ? `Add More (${cartQty})` : "Add to Cart"}
        </Button>
      </div>
    </motion.div>
  );
}

function OrderCard({
  order,
  idx,
  isExpired,
}: { order: Order; idx: number; isExpired?: boolean }) {
  const cfg = statusConfig[order.status];
  const Icon = cfg.icon;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.05 * idx }}
        className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm opacity-75"
        data-ocid={`orders.item.${idx + 1}`}
      >
        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-700 truncate line-through">
            {order.itemName}
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs flex-shrink-0 gap-1 font-semibold bg-red-100 text-red-700 border-red-300"
        >
          <AlertCircle className="w-3 h-3" />
          Order Expired
        </Badge>
      </motion.div>
    );
  }

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
  const { currentUser, navigate } = useApp();
  const { addNotification } = useNotifications();
  const { addItem, totalItems, items } = useCart();
  const customerId = currentUser?.id?.toString();
  const { data: orders = [], isLoading: ordersLoading } =
    useMyOrders(customerId);
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const createOrder = useCreateOrder();
  const { status, inZone, requestLocation } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(
    () =>
      localStorage.getItem("flashmart_push_dismissed") === "1" ||
      (typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission !== "default"),
  );
  const [showOutOfRange, setShowOutOfRange] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [itemError, setItemError] = useState("");
  const [lastCreated, setLastCreated] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    action: (() => void) | null;
  }>({ open: false, message: "", action: null });

  const orderFormRef = useRef<HTMLDivElement>(null);

  // ── Order Expiry Logic ─────────────────────────────────────────────────
  const [expiredOrderIds, setExpiredOrderIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("flashmart_expired_orders");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [expiredNotification, setExpiredNotification] = useState<{
    orderId: string;
    itemName: string;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiredOrderIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const order of orders) {
          const idStr = order.id.toString();
          if (
            order.status === "requested" &&
            !next.has(idStr) &&
            (() => {
              try {
                const ts: Record<string, number> = JSON.parse(
                  localStorage.getItem("flashmart_order_timestamps") || "{}",
                );
                const createdAt = ts[idStr];
                return createdAt
                  ? Date.now() - createdAt > 5 * 60 * 1000
                  : false;
              } catch {
                return false;
              }
            })()
          ) {
            next.add(idStr);
            changed = true;
            setExpiredNotification({
              orderId: idStr,
              itemName: order.itemName,
            });
            addNotification({
              title: "Order Expired ⏳",
              message: `No vendor accepted your order for "${order.itemName}". Tap to reorder.`,
              type: "order",
            });
          }
        }
        if (changed) {
          localStorage.setItem(
            "flashmart_expired_orders",
            JSON.stringify([...next]),
          );
          return next;
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [orders, addNotification]);

  useEffect(() => {
    if (status === "out_of_range") {
      setShowOutOfRange(true);
    }
  }, [status]);

  // ── Status change notifications ────────────────────────────────────────
  const prevStatuses = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    for (const order of orders) {
      const id = order.id.toString();
      const prev = prevStatuses.current.get(id);
      const curr = order.status as string;
      if (prev && prev !== curr) {
        const rawItems = (() => {
          try {
            const p = JSON.parse(order.itemName);
            return p?.items || order.itemName;
          } catch {
            return order.itemName;
          }
        })();
        if (curr === OrderStatus.storeConfirmed) {
          addNotification({
            title: "Order Accepted ✅",
            message: `A vendor accepted your order for ${rawItems}!`,
            type: "order",
          });
        } else if (curr === OrderStatus.riderAssigned) {
          addNotification({
            title: "Out for Delivery 🚴",
            message: `Your ${rawItems} is on the way!`,
            type: "order",
          });
        } else if (curr === OrderStatus.delivered) {
          addNotification({
            title: "Delivered! 🎉",
            message: `Your ${rawItems} has been delivered. Enjoy!`,
            type: "order",
          });
        }
      }
      prevStatuses.current.set(id, curr);
    }
  }, [orders, addNotification]);

  // ── Time-based offer notifications (once per slot per day) ─────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount only
  useEffect(() => {
    const hour = new Date().getHours();
    let slot: string | null = null;
    if (hour >= 6 && hour < 11) slot = "morning";
    else if (hour >= 11 && hour < 15) slot = "lunch";
    else if (hour >= 18 && hour < 22) slot = "evening";
    if (!slot) return;
    const today = new Date().toDateString();
    const stored = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("flashmart_last_offer_slot") || "{}",
        );
      } catch {
        return {};
      }
    })();
    if (stored.date === today && stored.slot === slot) return;
    const offerMap: Record<string, { title: string; message: string }> = {
      morning: {
        title: "Good morning! ☀️",
        message: "Only for you 🎯 — Fresh breakfast deals just dropped",
      },
      lunch: {
        title: "Lunchtime deals 🍱",
        message: "People near you are ordering lunch right now",
      },
      evening: {
        title: "Evening snacks 🌙",
        message: "Last chance ⏳ — Today's best deals end at midnight",
      },
    };
    const offer = offerMap[slot];
    addNotification({
      title: offer.title,
      message: offer.message,
      type: "offer",
    });
    localStorage.setItem(
      "flashmart_last_offer_slot",
      JSON.stringify({ date: today, slot }),
    );
  }, []);

  // ── Cart abandonment reminder (10 min) ────────────────────────────────
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(
      () => {
        addNotification({
          title: "You left something behind 👀",
          message:
            "Your cart is waiting — complete your order before items run out!",
          type: "reminder",
        });
      },
      10 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, [items.length, addNotification]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.productId.toString(),
      name: product.name,
      price: product.price,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleRequest = () => {
    if (!itemName.trim()) {
      setItemError("Please enter an item name.");
      return;
    }
    if (itemName.trim().length > 100) {
      setItemError("Item name too long (max 100 chars).");
      return;
    }
    setItemError("");
    const name = itemName.trim();
    setConfirmModal({
      open: true,
      message: `Place order for "${name}"?`,
      action: async () => {
        try {
          await createOrder.mutateAsync(name);
          setLastCreated(name);
          setItemName("");
          toast.success("Order placed successfully!");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Failed to place order.";
          toast.error(msg);
        }
      },
    });
  };

  const handleConfirm = () => {
    confirmModal.action?.();
    setConfirmModal({ open: false, message: "", action: null });
  };

  const handleCancel = () => {
    setConfirmModal({ open: false, message: "", action: null });
  };

  const activeOrders = orders.filter(
    (o) =>
      o.status !== OrderStatus.delivered &&
      !expiredOrderIds.has(o.id.toString()),
  );
  const expiredOrders = orders.filter(
    (o) => o.status === "requested" && expiredOrderIds.has(o.id.toString()),
  );
  const completedOrders = orders.filter(
    (o) => o.status === OrderStatus.delivered,
  );

  const filteredProducts = filterAndRankProducts(products, activeSearch);

  const renderLocationBanner = () => {
    if (status === "in_range") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5"
          data-ocid="dashboard.location_indicator"
        >
          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div>
            <span className="text-sm font-bold text-green-700">
              ✅ Inside Delivery Zone — Delivery available!
            </span>
          </div>
        </motion.div>
      );
    }

    if (status === "out_of_range") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
          data-ocid="dashboard.location_indicator"
        >
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div>
            <span className="text-sm font-bold text-red-700">
              ❌ Outside Delivery Zone — Delivery not available in your area
            </span>
          </div>
        </motion.div>
      );
    }

    if (status === "denied") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
          data-ocid="dashboard.location_indicator"
        >
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700">
            Location access denied — allow location to place orders
          </p>
        </motion.div>
      );
    }

    if (status === "requesting") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
          data-ocid="dashboard.location_indicator"
        >
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 font-semibold">
            Checking your location...
          </span>
        </motion.div>
      );
    }

    // idle — show prominent Enable Location card
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3"
        data-ocid="dashboard.location_indicator"
      >
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-gray-900">Enable Location</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Enable to check delivery availability
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          data-ocid="dashboard.enable_location_button"
          className="ml-3 flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-colors"
        >
          Enable
        </button>
      </motion.div>
    );
  };

  // suppress unused variable warning for inZone (used implicitly via status)
  void inZone;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <LocationModal
        open={showLocationModal}
        onAllow={() => {
          setShowLocationModal(false);
          requestLocation();
        }}
        onCancel={() => setShowLocationModal(false)}
      />
      <OutOfRangeModal
        open={showOutOfRange}
        onClose={() => setShowOutOfRange(false)}
      />
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Push Notification Permission Banner */}
      {!pushDismissed &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default" && (
          <div
            className="mb-4 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3"
            data-ocid="notifications.push_prompt.card"
          >
            <p className="text-xs text-blue-800 font-medium flex-1">
              Enable notifications to get order updates instantly.
            </p>
            <button
              type="button"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              data-ocid="notifications.push_enable.button"
              onClick={() => {
                Notification.requestPermission().then(() => {
                  setPushDismissed(true);
                  localStorage.setItem("flashmart_push_dismissed", "1");
                });
              }}
            >
              Enable
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-lg leading-none"
              data-ocid="notifications.push_dismiss.button"
              onClick={() => {
                setPushDismissed(true);
                localStorage.setItem("flashmart_push_dismissed", "1");
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

      {/* Expired Order Notification Banner */}
      <AnimatePresence>
        {expiredNotification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-0 right-0 mx-4 z-50 max-w-lg mx-auto"
            style={{
              maxWidth: "32rem",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="bg-red-600 text-white rounded-2xl shadow-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Order Expired</p>
                  <p className="text-xs text-red-100 mt-0.5">
                    No vendor accepted your order. Please try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpiredNotification(null)}
                  className="text-red-200 hover:text-white text-lg leading-none flex-shrink-0"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    navigate("cart");
                    setExpiredNotification(null);
                  }}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold text-xs flex-1 gap-1"
                  data-ocid="expired.reorder.button"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reorder
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpiredNotification(null)}
                  className="text-red-100 hover:text-white hover:bg-red-700 text-xs"
                  data-ocid="expired.dismiss.button"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {currentUser?.name || "Customer"} 👋
          </h1>
          <p className="text-sm text-foreground/70 font-medium">
            What do you need today?
          </p>
        </div>
        {totalItems > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => navigate("cart")}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({totalItems})
          </motion.button>
        )}
      </div>

      {/* Location Banner */}
      {renderLocationBanner()}

      {/* ── Product Grid ── */}
      <section className="mb-8" data-ocid="products.section">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              🛒 Shop Groceries
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Delivered in minutes to your door
            </p>
          </div>
        </div>
        <SmartSearchBar
          products={products}
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(q) => setActiveSearch(q)}
        />
        {activeSearch && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {filteredProducts.length === 0
                ? "No results found"
                : `${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""} for "${activeSearch}"`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveSearch("");
              }}
              className="text-xs text-green-600 font-semibold hover:underline"
            >
              Show all
            </button>
          </div>
        )}

        {productsLoading ? (
          <div
            className="flex items-center justify-center gap-2 text-gray-500 text-sm py-10"
            data-ocid="products.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin" /> Loading products...
          </div>
        ) : products.length === 0 ? (
          <div
            className="text-center py-12 text-gray-500 text-sm bg-gray-50 rounded-2xl"
            data-ocid="products.empty_state"
          >
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">
              No products available yet.
            </p>
            <p className="text-xs mt-1">
              Check back soon — vendors are stocking up!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((product, idx) => {
              const cartItem = items.find(
                (i) => i.id === product.productId.toString(),
              );
              return (
                <ProductCard
                  key={product.productId.toString()}
                  product={product}
                  idx={idx}
                  onAddToCart={handleAddToCart}
                  cartQty={cartItem?.quantity ?? 0}
                />
              );
            })}
          </div>
        )}

        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button
              onClick={() => navigate("cart")}
              className="w-full h-12 text-base font-extrabold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart ({totalItems} items)
            </Button>
          </motion.div>
        )}
      </section>

      {/* ── Order Input ── */}
      <div ref={orderFormRef}>
        <Card
          className="mb-6 shadow-card border-border"
          data-ocid="order.panel"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Request a Custom Item
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
      </div>

      {/* Active Orders */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Active Orders ({activeOrders.length})
        </h2>
        {ordersLoading ? (
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
              <OrderCard
                key={o.id.toString()}
                order={o}
                idx={i}
                isExpired={expiredOrderIds.has(o.id.toString())}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expired Orders */}
      {expiredOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-red-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expired Orders ({expiredOrders.length})
          </h2>
          <div className="space-y-2">
            {expiredOrders.map((o, i) => (
              <OrderCard
                key={o.id.toString()}
                order={o}
                idx={i}
                isExpired={true}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            No vendor accepted these orders in time.
          </p>
        </div>
      )}

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
