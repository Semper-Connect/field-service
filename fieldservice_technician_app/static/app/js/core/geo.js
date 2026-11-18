// The action is never blocked: without a position, the reason is sent instead.
const ERRORS = { 1: "denied", 2: "unavailable", 3: "timeout" };

const POSITION_ERRORS = {
    denied: "localisation refusée",
    unavailable: "position indisponible",
    timeout: "position trop lente",
    unsupported: "localisation non disponible",
};

export function currentPosition(timeoutMs = 10000) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ error: "unsupported" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (p) =>
                resolve({
                    latitude: p.coords.latitude,
                    longitude: p.coords.longitude,
                    accuracy: Math.round(p.coords.accuracy),
                }),
            (error) => resolve({ error: ERRORS[error.code] || "unavailable" }),
            { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
        );
    });
}

// "position ±12 m" or "sans position (localisation refusée)"
export function positionLabel(position) {
    if (position && position.latitude !== undefined) {
        return `position ±${position.accuracy} m`;
    }
    return `sans position (${POSITION_ERRORS[position && position.error] || "inconnue"})`;
}
