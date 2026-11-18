// When and where of an intervention, on the planning cards and the sheet.
import { dayLabel, dayOf, shortDate, time, todayKey } from "../utils/dates.js";
import { esc } from "../utils/html.js";

const isOverdue = (job) => !job.appointment && job.deadline && dayOf(job.deadline) < todayKey();

// "08:30 – 10:00" or "Journée"
function slotLabel(slot, { withDay = false } = {}) {
    const hours = slot.allday ? "Journée" : `${time(slot.start)} – ${time(slot.stop)}`;
    return withDay ? `${dayLabel(dayOf(slot.start))} · ${hours}` : hours;
}

export function whenHtml(job, options) {
    if (job.appointment) {
        return esc(slotLabel(job.appointment, options));
    }
    if (job.deadline) {
        return `<span class="${isOverdue(job) ? "text-danger" : ""}">Échéance ${esc(
            shortDate(job.deadline)
        )}</span>`;
    }
    return "Sans rendez-vous";
}

// "Étage 2 · Porte 21 · 75015 Paris"
export function placeDetailsHtml(place) {
    const parts = [
        place.floor && `Étage ${esc(place.floor)}`,
        place.apartment && `Porte ${esc(place.apartment)}`,
        (place.zip || place.city) &&
            `<span class="o_zip">${esc(place.zip)}</span> ${esc(place.city)}`,
    ];
    return parts.filter(Boolean).join(" · ");
}
