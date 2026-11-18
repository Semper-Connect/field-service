// "#/", "#/job/12", "#/job/12/report", "#/outbox": one screen per route.
import { app, dom, state } from "./core/env.js";
import { closeDialog } from "./core/ui.js";
import { renderJob } from "./screens/job/job.js";
import { renderLogin } from "./screens/login.js";
import { renderOutbox } from "./screens/outbox/outbox.js";
import { renderPlanning } from "./screens/planning/planning.js";
import { renderReport } from "./screens/report/report.js";

function parseRoute() {
    const [page, id, sub] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (page === "job" && id) {
        return { name: sub === "report" ? "report" : "job", id: Number(id) };
    }
    return { name: page === "outbox" ? "outbox" : "planning" };
}

export async function render() {
    const previous = state.route;
    const route = parseRoute();
    state.route = route;
    const entering = !previous || previous.name !== route.name || previous.id !== route.id;
    showNavigation(route);
    closeDialog();
    if (!state.known) {
        return renderLogin();
    }
    return renderRoute(route, entering);
}

// Back arrow everywhere but the planning, which shows the app icon instead.
function showNavigation(route) {
    dom.back.hidden = route.name === "planning";
    dom.appIcon.hidden = route.name !== "planning";
}

function renderRoute(route, entering) {
    switch (route.name) {
        case "job":
            return renderJob(route.id, { entering });
        case "report":
            return renderReport(route.id);
        case "outbox":
            return renderOutbox();
        default:
            return renderPlanning();
    }
}

// Not while the user is typing a report or a search.
app.rerender = () => {
    if (state.route && state.route.name !== "report" && dom.dialog.hidden && !state.searching) {
        render();
    }
};

export function goBack() {
    const route = state.route;
    location.hash = route && route.name === "report" ? `#/job/${route.id}` : "#/";
}
