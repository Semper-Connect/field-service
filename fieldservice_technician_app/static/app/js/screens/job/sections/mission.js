// "Mission": the service order, as label and value rows.
import { foldHtml } from "../../../components/widgets.js";
import { shortDate } from "../../../utils/dates.js";
import { esc, linkify } from "../../../utils/html.js";

export function missionFold(job) {
    const content = missionRows(job).map(
        ([label, value]) =>
            `<span class="o_label">${label}</span><span class="o_value">${value}</span>`
    );
    return foldHtml("Mission", 0, `<div class="o_group">${content.join("")}</div>`);
}

// [label, value HTML], without the empty ones.
function missionRows(job) {
    const m = job.mission;
    return [
        ["Mission", esc(m.name)],
        ["N° OS", esc(m.os_number)],
        ["Demande", m.object && `<span class="o_text_block">${linkify(m.object)}</span>`],
        ["Lieu", esc(job.place.name)],
        ["Client", esc(m.customer)],
        ["Syndic", esc(m.syndic)],
        ["Suivi par", esc(m.followed_by)],
        ["Demande du", m.requested_date && esc(shortDate(m.requested_date))],
    ].filter(([, value]) => value);
}
