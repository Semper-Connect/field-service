// The open intervention, reloaded from Odoo while the technician has it open,
// and redrawn without losing his place on the sheet.
import { app, dom, state, store } from "../../core/env.js";

const REFRESH_EVERY_MS = 10000;
let refreshTimer = null;

// Online: at once, then every 10 s until he leaves it. The other ones wait
// for the planning.
export function watchJob(id) {
    clearInterval(refreshTimer);
    const tick = () => refreshTick(id);
    tick();
    refreshTimer = setInterval(tick, REFRESH_EVERY_MS);
}

async function refreshTick(id) {
    const route = state.route;
    if (!route || route.name !== "job" || route.id !== id) {
        clearInterval(refreshTimer);
        return;
    }
    if (!navigator.onLine || document.visibilityState !== "visible" || state.syncing) {
        return;
    }
    try {
        if (await store.refreshJob(id)) {
            app.rerender();
        }
    } catch {
        // Offline or logged out: the phone's copy stays.
    }
}

// A refresh redraws the sheet: keep the open sections and the scroll position.
export function keptView(id) {
    if (Number(dom.view.dataset.job) !== id || !dom.view.querySelector(".o_hero")) {
        return null;
    }
    const open = [...dom.view.querySelectorAll(".o_fold[open]")].map(foldTitle);
    return { open, scroll: window.scrollY };
}

export function restoreView(id, kept) {
    dom.view.dataset.job = id;
    if (!kept) {
        return;
    }
    for (const fold of dom.view.querySelectorAll(".o_fold")) {
        fold.open = kept.open.includes(foldTitle(fold));
    }
    window.scrollTo(0, kept.scroll);
}

// "Chatter" of "Chatter 3": the count changes with the refresh.
const foldTitle = (fold) => fold.querySelector("summary").firstChild.textContent.trim();
