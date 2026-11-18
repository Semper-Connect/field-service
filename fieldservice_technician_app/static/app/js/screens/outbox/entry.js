// One card of the outbox: a report, or a press on Démarrer, Arrêter or Itinéraire.
import { store } from "../../core/env.js";
import { positionLabel } from "../../core/geo.js";
import { dateTime } from "../../utils/dates.js";
import { esc } from "../../utils/html.js";

const STATUSES = {
    pending: ["warning", "fa-clock-o", "En attente de réseau"],
    sending: ["warning", "fa-refresh", "Envoi en cours…"],
    sent: ["success", "fa-check", "Envoyé"],
    error: ["danger", "fa-exclamation-triangle", "Refusé"],
};
// Left by another technician logged in on this phone: sent when he logs in again.
const OTHER_TECHNICIAN = ["warning", "fa-user", "En attente de son technicien"];

export function entryHtml(entry, uid) {
    const [badge, icon, label] = badgeOf(entry, uid);
    return `
        <div class="o_card">
            <div class="o_card_head">
                <span class="o_card_ref">${esc(entry.mission)}</span>
                <span class="o_badge ${badge}"><i class="fa ${icon}"></i> ${label}</span>
            </div>
            <div class="o_card_title">${esc(entry.task_name)}</div>
            ${placeHtml(entry)}
            <div class="o_card_line">${esc(entryDetails(entry).join(" · "))}</div>
            ${refusedHtml(entry)}
            ${warningHtml(entry)}
        </div>`;
}

function badgeOf(entry, uid) {
    const waiting = store.WAITING.includes(entry.status);
    return waiting && entry.uid && entry.uid !== uid ? OTHER_TECHNICIAN : STATUSES[entry.status];
}

// "Démarré 2 oct. 09:12 · envoyé 2 oct. 09:13 · position ±12 m"
function entryDetails(entry) {
    // "checkpoint": stage change queued by an older version of the app
    const pointage = ["timer", "route", "checkpoint"].includes(entry.kind);
    return [
        entryLabel(entry),
        entry.sent_at && `envoyé ${dateTime(entry.sent_at)}`,
        pointage ? positionLabel(entry.payload.position) : entry.stage_name,
    ].filter(Boolean);
}

function entryLabel(entry) {
    const at = dateTime(entry.created_at);
    if (entry.kind === "timer") {
        return `${entry.timer === "start" ? "Démarré" : "Arrêté"} ${at}`;
    }
    if (entry.kind === "route") {
        return `Itinéraire ${at}`;
    }
    return entry.kind === "checkpoint" ? `Étape « ${entry.stage_name} » ${at}` : `Rempli ${at}`;
}

function placeHtml(entry) {
    if (!entry.place) {
        return "";
    }
    return `<div class="o_card_line"><i class="fa fa-map-marker"></i> ${esc(entry.place)}</div>`;
}

// Refused by Odoo: why, and a button to send it again.
function refusedHtml(entry) {
    if (entry.status !== "error") {
        return "";
    }
    return `
            <div class="o_error_text">${esc(entry.error)}</div>
            <button class="btn btn-secondary btn-sm o_retry" data-retry="${esc(entry.uuid)}">
                <i class="fa fa-repeat"></i> Réessayer
            </button>`;
}

// Applied by Odoo, but not all of it.
function warningHtml(entry) {
    const warning = entry.result && entry.result.warning;
    return warning ? `<div class="o_warning_text">${esc(warning)}</div>` : "";
}
