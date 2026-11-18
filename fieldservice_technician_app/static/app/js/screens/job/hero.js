// Top of the intervention sheet: when, where, what, and how to get there.
import { placeDetailsHtml, whenHtml } from "../../components/job_summary.js";
import { esc } from "../../utils/html.js";
import { mapsUrl, telUrl } from "../../utils/links.js";

const STAR = '<i class="fa fa-star o_priority_star"></i> ';

// stageId: the stage chosen in a report not sent yet, else Odoo's.
export function heroHtml(job, stageId) {
    const place = job.place;
    const when = (job.priority ? STAR : "") + whenHtml(job, { withDay: true });
    const street = esc(place.street || place.name || "Adresse non renseignée");
    return `
        <div class="o_hero o_color_${job.color}">
            <div class="o_hero_time">${when}</div>
            ${stageLineHtml(job, stageId)}
            <div class="o_hero_street">${street}</div>
            <div class="o_hero_where">${placeDetailsHtml(place)}</div>
            <div class="o_hero_object">${esc(job.name)}</div>
            <div class="o_hero_actions">${actionsHtml(job)}</div>
        </div>`;
}

// Changed in the report only: shown here, as on the planning card.
function stageLineHtml(job, stageId) {
    const stage = (job.stages || []).find((s) => s.id === stageId);
    const name = stage ? stage.name : job.stage;
    if (!name) {
        return "";
    }
    return `<div class="o_hero_stage">Statut : <span class="o_stage">${esc(name)}</span></div>`;
}

function actionsHtml(job) {
    const phone = (job.contacts.find((c) => c.phone) || {}).phone;
    return `
        ${linkButton("btn-action", "fa-location-arrow", "Itinéraire", mapsUrl(job.place), "route")}
        ${linkButton("btn-secondary", "fa-phone", "Appeler", phone && telUrl(phone))}`;
}

// id: opened in a new tab (the maps app), with this id.
function linkButton(style, icon, label, url, id = "") {
    const target = id ? `id="${id}" target="_blank" rel="noopener"` : "";
    return `
        <a class="btn ${style} ${url ? "" : "disabled"}" href="${url || "#"}" ${target}>
            <i class="fa ${icon}"></i> ${label}
        </a>`;
}
