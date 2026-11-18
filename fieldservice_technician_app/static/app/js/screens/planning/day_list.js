// The cards of one day, or why there are none.
import { emptyHtml } from "../../components/widgets.js";
import { state } from "../../core/env.js";
import { esc } from "../../utils/html.js";
import { cardHtml } from "./cards.js";

const LOADING_DAY = `<p class="o_hint"><i class="fa fa-spinner fa-spin"></i> Chargement du jour…</p>`;

export function dayListHtml(view, status) {
    let body = dayBodyHtml(view, status);
    if (view.loading && view.inWindow) {
        body += loadingColleagueHtml(view.colleague);
    }
    if (view.unplanned.length && view.downloaded && !view.partial) {
        body += unplannedHtml(view.unplanned, status);
    }
    return body;
}

function dayBodyHtml(view, status) {
    if (view.dayLoad === "loading") {
        return LOADING_DAY;
    }
    if (!view.downloaded) {
        return notDownloadedHtml(view);
    }
    if (view.partial) {
        return partialHtml(view.colleague);
    }
    if (!view.ofDay.length) {
        const hint = view.lastSync
            ? ""
            : "Votre planning apparaîtra après la première synchronisation.";
        return emptyHtml("fa-calendar-o", "Aucun rendez-vous ce jour", hint);
    }
    return view.ofDay.map((job) => cardHtml(job, status[job.id])).join("");
}

function notDownloadedHtml({ planningWindow, dayLoad }) {
    const retry =
        dayLoad === "failed"
            ? "Le chargement a échoué : actualisez pour réessayer."
            : "Connectez-vous à internet pour le voir.";
    return emptyHtml(
        "fa-cloud-download",
        "Jour non téléchargé",
        `Le téléphone garde les ${planningWindow.days_before} derniers jours ` +
            `et les ${planningWindow.days_after} prochains jours. ${retry}`
    );
}

function partialHtml(colleague) {
    return emptyHtml(
        "fa-cloud-download",
        "Jour non téléchargé",
        `Seuls aujourd'hui et demain de ${colleague.name} sont sur le téléphone. ` +
            "Ouvrez son planning avec du réseau pour voir les autres jours."
    );
}

const loadingColleagueHtml = (colleague) => `<p class="o_hint"><i class="fa fa-spinner fa-spin"></i>
            Chargement du planning de ${esc(colleague.name)}…</p>`;

function unplannedHtml(unplanned, status) {
    return `
            <details class="o_fold o_fold_flat" id="unplanned" ${state.openUnplanned ? "open" : ""}>
                <summary>Sans rendez-vous <span class="o_count">${unplanned.length}</span></summary>
                ${unplanned.map((job) => cardHtml(job, status[job.id])).join("")}
            </details>`;
}
