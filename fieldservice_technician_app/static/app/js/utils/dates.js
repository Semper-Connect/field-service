// Server dates are UTC ISO strings; days are local "YYYY-MM-DD" keys.
import { capitalize } from "./text.js";

const pad = (n) => String(n).padStart(2, "0");
const noon = (key) => new Date(`${key}T12:00:00`); // safe from DST shifts

const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const todayKey = () => dayKey(new Date());
export const dayOf = (iso) => dayKey(new Date(iso));

export function addDays(key, n) {
    const date = noon(key);
    date.setDate(date.getDate() + n);
    return dayKey(date);
}

export const mondayOf = (key) => addDays(key, -((noon(key).getDay() + 6) % 7));

export const time = (iso) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const shortDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const longDate = (key) =>
    noon(key).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
export const dateTime = (iso) =>
    iso
        ? new Date(iso).toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

const RELATIVE_DAYS = { 0: "Aujourd'hui", 1: "Demain", "-1": "Hier" };

// "Aujourd'hui", "Demain", "Hier", else "Jeudi 2 octobre" ("Jeudi" if short).
export function dayLabel(key, { short = false } = {}) {
    const today = todayKey();
    for (const [offset, label] of Object.entries(RELATIVE_DAYS)) {
        if (key === addDays(today, Number(offset))) {
            return label;
        }
    }
    const options = short
        ? { weekday: "long" }
        : { weekday: "long", day: "numeric", month: "long" };
    return capitalize(noon(key).toLocaleDateString("fr-FR", options));
}

// 1.5 -> "01:30"
export function floatTime(hours) {
    const minutes = Math.round((Number(hours) || 0) * 60);
    const total = Math.abs(minutes);
    const sign = minutes < 0 ? "-" : "";
    return `${sign}${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// 0.25 -> "15 min", 1.5 -> "1 h 30"
export function durationLabel(hours) {
    const minutes = Math.round((Number(hours) || 0) * 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${pad(minutes % 60)}`;
}

export const hoursSince = (iso) => Math.max(0, (Date.now() - Date.parse(iso)) / 3600000);
