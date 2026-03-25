import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

const DEFAULT_LAT = 17.339;
const DEFAULT_LNG = 78.5583;
const ZOOM = 15;

function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  widthPx: number,
  heightPx: number,
): { x: number; y: number } {
  const scale = 2 ** zoom;
  const toX = (ln: number) => ((ln + 180) / 360) * scale * 256;
  const toY = (la: number) => {
    const sinLat = Math.sin((la * Math.PI) / 180);
    return (
      ((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) *
      scale *
      256
    );
  };
  return {
    x: widthPx / 2 + (toX(lng) - toX(centerLng)),
    y: heightPx / 2 + (toY(lat) - toY(centerLat)),
  };
}

export default function MapPickerModal({
  open,
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: Props) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );
  const [center] = useState({
    lat: initialLat ?? DEFAULT_LAT,
    lng: initialLng ?? DEFAULT_LNG,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 400, h: 360 });

  useEffect(() => {
    if (open) {
      setPin(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
      );
    }
  }, [open, initialLat, initialLng]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const scale = 2 ** ZOOM;
    const toX = (ln: number) => ((ln + 180) / 360) * scale * 256;
    const toY = (la: number) => {
      const sinLat = Math.sin((la * Math.PI) / 180);
      return (
        ((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) *
        scale *
        256
      );
    };
    const px = toX(center.lng) + (relX - w / 2);
    const py = toY(center.lat) + (relY - h / 2);

    const newLng = (px / (scale * 256)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * py) / (scale * 256);
    const newLat =
      (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    setPin({ lat: newLat, lng: newLng });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      // Fallback: pin center of map on keyboard activation
      setPin({ lat: center.lat, lng: center.lng });
    }
  };

  if (!open) return null;

  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.01},${center.lat - 0.008},${center.lng + 0.01},${center.lat + 0.008}&layer=mapnik`;

  const pinPos = pin
    ? latLngToPixel(
        pin.lat,
        pin.lng,
        center.lat,
        center.lng,
        ZOOM,
        dims.w,
        dims.h,
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-sm">
                Pin Delivery Location
              </h2>
              <p className="text-xs text-gray-500">
                Tap anywhere on the map to drop a pin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 mx-3 mb-3 rounded-xl overflow-hidden relative"
          style={{ minHeight: 300, height: 360 }}
        >
          <iframe
            title="Delivery area map"
            src={iframeSrc}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: "none",
            }}
          />
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: map click handler, keyboard fallback via onKeyDown */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tap map to drop a pin"
            className="absolute inset-0 cursor-crosshair"
            onClick={handleMapClick}
            onKeyDown={handleKeyDown}
            style={{ zIndex: 10 }}
          />
          {pin && pinPos && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: pinPos.x - 12,
                top: pinPos.y - 28,
                zIndex: 20,
              }}
            >
              <MapPin className="w-6 h-6 text-red-500 drop-shadow-md" />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 flex-shrink-0 space-y-2">
          {pin ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700 font-semibold">
                Pin at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">
                No location pinned yet — tap the map
              </span>
            </div>
          )}
          <Button
            onClick={() => pin && onConfirm(pin.lat, pin.lng)}
            disabled={!pin}
            className="w-full h-11 font-extrabold bg-green-500 hover:bg-green-600 text-white rounded-xl disabled:opacity-40"
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
