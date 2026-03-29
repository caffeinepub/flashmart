import type { Store } from "../backend.d";

export const GLOBAL_DELIVERY_ZONE: { lat: number; lng: number }[] = [
  { lat: 17.3448, lng: 78.5458 },
  { lat: 17.3462, lng: 78.5595 },
  { lat: 17.3368, lng: 78.5708 },
  { lat: 17.332, lng: 78.5602 },
  { lat: 17.3365, lng: 78.5472 },
];

/**
 * Convert backend zone format ([lat, lng] tuples) to {lat, lng} objects.
 */
export function zoneToLatLng(
  zone: Array<[number, number]>,
): { lat: number; lng: number }[] {
  return zone.map(([lat, lng]) => ({ lat, lng }));
}

/**
 * Expand polygon outward from centroid by `buffer` degrees to handle GPS jitter.
 */
function expandPolygon(
  polygon: { lat: number; lng: number }[],
  buffer: number,
): { lat: number; lng: number }[] {
  const n = polygon.length;
  if (n === 0) return polygon;
  const cLat = polygon.reduce((s, p) => s + p.lat, 0) / n;
  const cLng = polygon.reduce((s, p) => s + p.lng, 0) / n;
  return polygon.map((p) => {
    const dLat = p.lat - cLat;
    const dLng = p.lng - cLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-9;
    return {
      lat: p.lat + (dLat / dist) * buffer,
      lng: p.lng + (dLng / dist) * buffer,
    };
  });
}

/**
 * Ray-casting point-in-polygon with a small buffer (~0.0005°) for GPS edge tolerance.
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: { lat: number; lng: number }[],
  buffer = 0.0005,
): boolean {
  const expanded = expandPolygon(polygon, buffer);
  let inside = false;
  const n = expanded.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = expanded[i].lng;
    const yi = expanded[i].lat;
    const xj = expanded[j].lng;
    const yj = expanded[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Returns the effective delivery zone for a store.
 * Uses store's custom zone if useCustomZone is true and zone has >2 points,
 * otherwise falls back to the global zone.
 */
export function getEffectiveZone(
  store: Store | null | undefined,
): { lat: number; lng: number }[] {
  if (
    store?.useCustomZone &&
    store.customDeliveryZone &&
    store.customDeliveryZone.length > 2
  ) {
    return zoneToLatLng(store.customDeliveryZone);
  }
  return GLOBAL_DELIVERY_ZONE;
}
