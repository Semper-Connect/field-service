// Links leaving the app: itinerary and phone calls.
export function mapsUrl(place) {
    if (!place) {
        return null;
    }
    const query =
        place.lat && place.lng
            ? `${place.lat},${place.lng}`
            : [place.street, place.zip, place.city].filter(Boolean).join(" ");
    return query
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
        : null;
}

export const telUrl = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;
