// Itinéraire: the link opens the maps app at once, as before; meanwhile the
// phone's position is saved as a check-in (where he set off from), sent like
// Démarrer when the network allows. Neither the timer nor the stage change.
import { store } from "../core/env.js";
import { currentPosition } from "../core/geo.js";
import { requestBackgroundSync, syncNow } from "../core/sync.js";

export function bindRoute(link, jobId) {
    link.addEventListener("click", () => recordRoute(jobId));
}

async function recordRoute(jobId) {
    const pressedAt = new Date().toISOString();
    const job = await store.getJob(jobId);
    // Not his to change (Odoo would refuse it): no check-in
    if (!job || job.writable === false) {
        return;
    }
    const position = await currentPosition(8000);
    await store.queueRoute(job, position, pressedAt);
    requestBackgroundSync();
    if (navigator.onLine) {
        syncNow({ refresh: false });
    }
}
