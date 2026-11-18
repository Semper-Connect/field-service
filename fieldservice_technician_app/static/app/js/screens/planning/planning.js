// Planning: one day at a time, his own or a visible colleague's.
import { dom, state, store } from "../../core/env.js";
import { syncNow } from "../../core/sync.js";
import { toast } from "../../core/ui.js";
import { addDays, dateTime, todayKey } from "../../utils/dates.js";
import { esc } from "../../utils/html.js";
import { cardStatuses } from "./card_status.js";
import { bindCards } from "./cards.js";
import { dayListHtml } from "./day_list.js";
import { dayNavHtml } from "./day_nav.js";
import { dayView } from "./day_view.js";
import { renderSearch } from "./search.js";

export function goToDay(key) {
    state.day = key;
    renderPlanning();
    window.scrollTo(0, 0);
}

export async function renderPlanning() {
    const [jobs, drafts, outbox] = await Promise.all([
        store.getJobs(),
        store.getDrafts(),
        store.listOutbox(),
    ]);
    const status = cardStatuses(jobs, drafts, outbox);
    state.day = state.day || todayKey();
    // Colleagues' interventions are only shown in their planning.
    const mine = jobs.filter((job) => job.mine !== false);
    return state.searching
        ? renderSearch(mine, status, renderPlanning)
        : renderDay(jobs, mine, status);
}

async function renderDay(allJobs, jobs, status) {
    const view = await dayView(allJobs, jobs, renderPlanning);
    dom.title.textContent = view.colleague ? "Planning" : "Mon planning";
    dom.view.innerHTML = `
        ${dayNavHtml(view)}
        <div class="o_day_list">${dayListHtml(view, status)}</div>
        ${updatedHtml(view.lastSync)}
        ${footerHtml(view.day, view.today)}`;
    bindDay(view.day, view.today);
    bindCards(dom.view);
}

function updatedHtml(lastSync) {
    return lastSync ? `<p class="o_hint o_updated">Mis à jour ${esc(dateTime(lastSync))}</p>` : "";
}

function footerHtml(day, today) {
    const todayButton =
        day === today
            ? ""
            : `<button class="btn btn-secondary" id="today">
                   <i class="fa fa-calendar-check-o"></i> Aujourd'hui</button>`;
    return `
        <div class="o_sticky_footer">
            ${todayButton}
            <button class="btn btn-secondary btn-icon" id="search-open" aria-label="Rechercher">
                <i class="fa fa-search"></i></button>
            <button class="btn btn-secondary" id="refresh">
                <i class="fa fa-refresh"></i> Actualiser</button>
        </div>`;
}

function bindDay(day, today) {
    onClick("prev-day", () => goToDay(addDays(day, -1)));
    onClick("next-day", () => goToDay(addDays(day, 1)));
    onClick("today", () => goToDay(today));
    onClick("search-open", openSearch);
    onClick("refresh", refresh);
    for (const button of dom.view.querySelectorAll("[data-day]")) {
        button.onclick = () => goToDay(button.dataset.day);
    }
    bindWho();
    bindUnplanned();
}

function onClick(id, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.onclick = handler;
    }
}

function openSearch() {
    state.searching = true;
    renderPlanning();
}

function refresh() {
    if (!navigator.onLine) {
        toast("Pas de réseau pour le moment.", "warning");
    }
    syncNow({ quiet: false });
}

// Whose planning is shown: his or a colleague's.
function bindWho() {
    const who = document.getElementById("who");
    if (who) {
        who.onchange = () => {
            state.who = who.value;
            renderPlanning();
        };
    }
}

// "Sans rendez-vous" stays open or closed from one day to the next.
function bindUnplanned() {
    const unplanned = document.getElementById("unplanned");
    if (unplanned) {
        unplanned.addEventListener("toggle", () => (state.openUnplanned = unplanned.open));
    }
}
