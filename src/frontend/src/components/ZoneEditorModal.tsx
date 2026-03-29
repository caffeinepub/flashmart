import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GLOBAL_DELIVERY_ZONE } from "../utils/geofence";

declare global {
  interface Window {
    L: any;
  }
}

const DEFAULT_LAT = 17.339;
const DEFAULT_LNG = 78.5583;
const DEFAULT_ZOOM = 14;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if (window.L) {
      resolve();
      return;
    }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (zone: Array<[number, number]>) => void;
  initialZone?: Array<[number, number]>;
}

export default function ZoneEditorModal({
  open,
  onClose,
  onSave,
  initialZone,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!leafletReady) {
      loadLeaflet().then(() => setLeafletReady(true));
    }
  }, [leafletReady]);

  // Initialize points from initialZone or global zone
  useEffect(() => {
    if (open) {
      if (initialZone && initialZone.length > 2) {
        setPoints(initialZone.map(([lat, lng]) => ({ lat, lng })));
      } else {
        setPoints([...GLOBAL_DELIVERY_ZONE]);
      }
    }
  }, [open, initialZone]);

  // Draw markers + polygon whenever points change
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;
    const L = window.L;
    const map = mapRef.current;

    // Remove old markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    // Remove old polygon
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (points.length < 1) return;

    // Draw polygon if >= 3 points
    if (points.length >= 3) {
      polygonRef.current = L.polygon(
        points.map((p) => [p.lat, p.lng]),
        { color: "#16a34a", weight: 2, fillOpacity: 0.12 },
      ).addTo(map);
    }

    // Add markers with remove button
    points.forEach((p, idx) => {
      const removeIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;display:inline-block">
          <div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>
          <button data-idx="${idx}" style="position:absolute;top:-8px;right:-8px;width:16px;height:16px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.4);font-weight:bold">×</button>
        </div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([p.lat, p.lng], {
        icon: removeIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setPoints((prev) => {
          const next = [...prev];
          next[idx] = { lat: pos.lat, lng: pos.lng };
          return next;
        });
      });

      // DivIcon click for remove button
      marker.on("click", (e: any) => {
        const target = e.originalEvent?.target as HTMLElement;
        if (target?.dataset?.idx !== undefined) {
          const i = Number(target.dataset.idx);
          setPoints((prev) => prev.filter((_, pi) => pi !== i));
        }
      });

      markersRef.current.push(marker);
    });
  }, [points, leafletReady]);

  // Init map
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polygonRef.current = null;
        markersRef.current = [];
      }
      return;
    }
    if (!leafletReady) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = window.L;
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        setPoints((prev) => [
          ...prev,
          { lat: e.latlng.lat, lng: e.latlng.lng },
        ]);
      });

      mapRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
        // Fit to zone if we have points
        setPoints((prev) => {
          if (prev.length >= 2) {
            try {
              const bounds = L.latLngBounds(prev.map((p) => [p.lat, p.lng]));
              map.fitBounds(bounds, { padding: [30, 30] });
            } catch {}
          }
          return prev;
        });
      }, 150);
    }, 50);

    return () => clearTimeout(timer);
  }, [open, leafletReady]);

  const handleResetToGlobal = () => {
    setPoints([...GLOBAL_DELIVERY_ZONE]);
    if (mapRef.current) {
      const L = window.L;
      try {
        const bounds = L.latLngBounds(
          GLOBAL_DELIVERY_ZONE.map((p) => [p.lat, p.lng]),
        );
        mapRef.current.fitBounds(bounds, { padding: [30, 30] });
      } catch {}
    }
  };

  const handleSave = () => {
    if (points.length < 3) return;
    onSave(points.map((p) => [p.lat, p.lng]));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-sm">
                Edit Delivery Zone
              </h2>
              <p className="text-xs text-gray-500">
                Tap map to add points · Tap × on point to remove
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            data-ocid="zone_editor.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map */}
        <div
          className="mx-3 rounded-xl overflow-hidden flex-shrink-0"
          style={{ height: "55vh", minHeight: 280, position: "relative" }}
        >
          {!leafletReady ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">
              {points.length} point{points.length !== 1 ? "s" : ""}
              {points.length < 3 && (
                <span className="text-orange-500 ml-1">(min 3 required)</span>
              )}
            </span>
            <button
              type="button"
              onClick={handleResetToGlobal}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              data-ocid="zone_editor.reset.button"
            >
              <RefreshCw className="w-3 h-3" />
              Reset to Global
            </button>
          </div>
          <Button
            onClick={handleSave}
            disabled={points.length < 3}
            className="w-full h-11 font-extrabold bg-green-500 hover:bg-green-600 text-white rounded-xl disabled:opacity-40"
            data-ocid="zone_editor.save.button"
          >
            Confirm Zone
          </Button>
        </div>
      </div>
    </div>
  );
}
