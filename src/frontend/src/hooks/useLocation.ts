import { useCallback, useEffect, useState } from "react";

export type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "in_range"
  | "out_of_range";

const STORAGE_KEY = "flashmart_location_status";

// Refined polygon delivery zone
const deliveryZone = [
  { lat: 17.3448, lng: 78.5458 },
  { lat: 17.3462, lng: 78.5595 },
  { lat: 17.3368, lng: 78.5708 },
  { lat: 17.332, lng: 78.5602 },
  { lat: 17.3365, lng: 78.5472 },
];

/**
 * Ray-casting point-in-polygon algorithm.
 * The polygon is automatically closed (last point connects to first).
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

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LocationStatus | null;
    return stored ?? "idle";
  });
  const [inZone, setInZone] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "idle") {
      localStorage.setItem(STORAGE_KEY, status);
    }
  }, [status]);

  const requestLocation = useCallback(() => {
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const inside = isPointInPolygon(
          pos.coords.latitude,
          pos.coords.longitude,
          deliveryZone,
        );
        setInZone(inside);
        setStatus(inside ? "in_range" : "out_of_range");
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { status, inZone, requestLocation };
}
