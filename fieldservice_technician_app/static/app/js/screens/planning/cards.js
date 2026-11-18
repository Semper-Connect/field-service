// Cards of the planning and of the search results.
import { placeDetailsHtml, whenHtml } from "../../components/job_summary.js";
import { bindRoute } from "../../components/route_checkin.js";
import { esc } from "../../utils/html.js";
import { mapsUrl } from "../../utils/links.js";
import { STATUS_ICONS } from "./card_status.js";

const STAR = '<i class="fa fa-star o_priority_star"></i>';

export function cardHtml(job, status, { withDay = false } = {}) {
    const place = job.place || {};
    const details = placeDetailsHtml(place);
    const street = place.street || place.name || (job.readonly ? "" : "Adresse non renseignée");
    const link = job.readonly ? "" : `data-job="${job.id}" role="link" tabindex="0"`;
    const star = job.priority ? STAR : "";
    const when = whenHtml(job, { withDay });
    const tags = stageHtml(job) + statusIconHtml(status);
    return `
        <div class="o_day_card o_color_${job.color} ${job.readonly ? "o_readonly" : ""}" ${link}>
            <div class="o_day_main">
                <div class="o_day_time">${star}${when}${tags}</div>
                <div class="o_day_street">${esc(street)}</div>
                ${details ? `<div class="o_day_where">${details}</div>` : ""}
                <div class="o_day_object">${esc(job.name)}${missionHtml(job)}</div>
            </div>
            ${navButtonHtml(place)}
        </div>`;
}

const stageHtml = (job) => (job.stage ? `<span class="o_stage">${esc(job.stage)}</span>` : "");

const missionHtml = (job) =>
    job.missionName ? ` <span class="text-muted">· ${esc(job.missionName)}</span>` : "";

function statusIconHtml(status) {
    const icon = STATUS_ICONS[status];
    if (!icon) {
        return "";
    }
    const [style, iconClass, title] = icon;
    return `<span class="o_status_icon ${style}" title="${title}"><i class="fa ${iconClass}"></i></span>`;
}

function navButtonHtml(place) {
    const maps = mapsUrl(place);
    if (!maps) {
        return "";
    }
    return `<a class="o_nav_btn" href="${maps}" target="_blank" rel="noopener" aria-label="Itinéraire">
               <i class="fa fa-location-arrow"></i></a>`;
}

export function bindCards(root) {
    for (const card of root.querySelectorAll("[data-job]")) {
        bindCard(card);
    }
}

// Opens the intervention, but not from its itinerary button.
function bindCard(card) {
    const open = () => (location.hash = `#/job/${card.dataset.job}`);
    const nav = card.querySelector(".o_nav_btn");
    if (nav) {
        bindRoute(nav, Number(card.dataset.job));
    }
    card.addEventListener("click", (event) => {
        if (!event.target.closest(".o_nav_btn")) {
            open();
        }
    });
    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            open();
        }
    });
}
