// Intervention sheet: time and address first, the rest folded.
import { bindBuildingContacts } from "../../components/building_contacts.js";
import { bindDocuments } from "../../components/documents.js";
import { bindRoute } from "../../components/route_checkin.js";
import { bindTimerField, timerFieldHtml } from "../../components/timer_field.js";
import { emptyHtml } from "../../components/widgets.js";
import { dom, store } from "../../core/env.js";
import { heroHtml } from "./hero.js";
import { keptView, restoreView, watchJob } from "./refresh.js";
import { foldsHtml } from "./sections/index.js";

// entering: opened from another screen, not redrawn after a refresh.
export async function renderJob(id, { entering = false } = {}) {
    if (entering) {
        watchJob(id);
    }
    const job = await store.getJob(id);
    if (!job) {
        renderMissing();
        return;
    }
    const [draft, company, timer, stageId] = await loadJobState(job);
    const kept = keptView(id);
    dom.title.textContent = job.mission.name || "Intervention";
    dom.view.innerHTML = sheetHtml(job, { draft, company, timer, stageId });
    bindTimerField(job, timer, () => renderJob(job.id));
    bindDocuments();
    bindBuildingContacts(job);
    bindRouteButton(job);
    restoreView(id, kept);
}

// Its draft, the company's instructions, his timer and the stage to show.
function loadJobState(job) {
    return Promise.all([
        store.getDraft(job.id),
        store.getMeta("company"),
        store.getTimer(job),
        store.getStageId(job),
    ]);
}

function bindRouteButton(job) {
    const route = document.getElementById("route");
    if (route && !route.classList.contains("disabled")) {
        bindRoute(route, job.id);
    }
}

function sheetHtml(job, { draft, company, timer, stageId }) {
    return `
        ${heroHtml(job, stageId)}
        ${timerFieldHtml(job, timer)}
        ${foldsHtml(job, company)}
        ${footerHtml(job.id, draft)}`;
}

function renderMissing() {
    dom.title.textContent = "Intervention";
    dom.view.innerHTML = emptyHtml(
        "fa-search",
        "Introuvable sur ce téléphone",
        "Elle n'est peut-être plus assignée. Actualisez le planning."
    );
}

function footerHtml(id, draft) {
    const label = draft ? "Reprendre le rapport" : "Remplir le rapport";
    return `
        <div class="o_sticky_footer">
            <a class="btn btn-primary" href="#/job/${id}/report">
                <i class="fa fa-pencil-square-o"></i> ${label}
            </a>
        </div>`;
}
