export type GeoPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

export type GeoCoords = {
  lat: number;
  lng: number;
  accuracyMeters: number;
};

export type GeoResult =
  | { ok: true; coords: GeoCoords }
  | { ok: false; code: "unsupported" | "denied" | "unavailable" | "timeout"; message: string };

const HIGH_ACCURACY: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 0,
};

export function isSecureGeoContext(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

export async function queryGeoPermission(): Promise<GeoPermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }
  if (!isSecureGeoContext()) return "unsupported";

  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (status.state === "granted") return "granted";
      if (status.state === "denied") return "denied";
      return "prompt";
    }
  } catch {
    // iOS Safari often rejects Permissions API for geolocation.
  }
  return "prompt";
}

export function getCurrentPositionPrecise(): Promise<GeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      code: "unsupported",
      message: "La géolocalisation n’est pas disponible sur cet appareil.",
    });
  }
  if (!isSecureGeoContext()) {
    return Promise.resolve({
      ok: false,
      code: "unsupported",
      message:
        "La localisation nécessite HTTPS (ou localhost). Ouvrez le site en sécurisé.",
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
          },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({
            ok: false,
            code: "denied",
            message:
              "Permission refusée. Autorisez la localisation dans Réglages du navigateur, puis réessayez.",
          });
          return;
        }
        if (err.code === err.TIMEOUT) {
          resolve({
            ok: false,
            code: "timeout",
            message: "Délai dépassé. Activez le GPS et réessayez à l’extérieur.",
          });
          return;
        }
        resolve({
          ok: false,
          code: "unavailable",
          message: "Position indisponible. Vérifiez le GPS puis réessayez.",
        });
      },
      HIGH_ACCURACY,
    );
  });
}

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsNavigateUrl(opts: {
  destLat?: number | null;
  destLng?: number | null;
  destLabel: string;
  originLat?: number | null;
  originLng?: number | null;
}): string {
  const dest =
    opts.destLat != null && opts.destLng != null
      ? `${opts.destLat},${opts.destLng}`
      : opts.destLabel;

  const params = new URLSearchParams({
    api: "1",
    destination: dest,
    travelmode: "driving",
  });

  if (opts.originLat != null && opts.originLng != null) {
    params.set("origin", `${opts.originLat},${opts.originLng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
