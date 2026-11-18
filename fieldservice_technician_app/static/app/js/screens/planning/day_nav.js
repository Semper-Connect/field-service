// Top of the planning: whose planning, the day with its arrows, the week strip.
import { addDays, dayLabel, longDate, mondayOf } from "../../utils/dates.js";
import { esc } from "../../utils/html.js";
import { telUrl } from "../../utils/links.js";

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function dayNavHtml({ day, today, colleagues, colleague, busyDays }) {
    return `
        <div class="o_daynav">
            ${colleagues.length ? whoSelectHtml(colleagues, colleague) : ""}
            <div class="o_daynav_row">
                <button class="o_daynav_arrow" id="prev-day" aria-label="Jour précédent">
                    <i class="fa fa-chevron-left"></i></button>
                <div class="o_daynav_label">
                    <b>${esc(dayLabel(day, { short: true }))}</b>
                    <span>${esc(longDate(day))}</span>
                </div>
                <button class="o_daynav_arrow" id="next-day" aria-label="Jour suivant">
                    <i class="fa fa-chevron-right"></i></button>
            </div>
            ${weekStripHtml(day, today, busyDays)}
        </div>`;
}

function whoSelectHtml(colleagues, colleague) {
    const options = colleagues.map((c) => {
        const selected = colleague === c ? "selected" : "";
        return `<option value="${c.id}" ${selected}>${esc(c.name)}</option>`;
    });
    return `
        <div class="o_who">
            <label class="o_who_select">
                <i class="fa ${colleague ? "fa-users" : "fa-user"}"></i>
                <select id="who" aria-label="Planning affiché">
                    <option value="me">Mon planning</option>${options.join("")}
                </select>
                <i class="fa fa-caret-down"></i>
            </label>
            ${callButtonHtml(colleague)}
        </div>`;
}

function callButtonHtml(colleague) {
    if (!colleague || !colleague.phone) {
        return "";
    }
    return `<a class="o_icon_btn" href="${telUrl(colleague.phone)}"
                  aria-label="Appeler ${esc(colleague.name)}"><i class="fa fa-phone"></i></a>`;
}

function weekStripHtml(day, today, busyDays) {
    const monday = mondayOf(day);
    const days = WEEKDAY_LETTERS.map((letter, i) => {
        const key = addDays(monday, i);
        const classes = [key === day && "active", key === today && "today"].filter(Boolean);
        const dot = busyDays.has(key) ? "dot" : "";
        return `
            <button class="o_weekday ${classes.join(" ")}" data-day="${key}">
                <span>${letter}</span><b>${Number(key.slice(8))}</b><i class="${dot}"></i>
            </button>`;
    });
    return `<div class="o_weekstrip">${days.join("")}</div>`;
}
