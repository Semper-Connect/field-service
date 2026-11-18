import { app, state, store } from "./env.js";
import { updateStatus } from "./status.js";
import { toast } from "./ui.js";

// Reports, Démarrer and Arrêter alike
const sentMessage = (n) => (n > 1 ? `${n} envois transmis à Odoo` : "Envoyé à Odoo");
const refusedMessage = (n) =>
    `${n > 1 ? `${n} envois refusés` : "Un envoi refusé"} par Odoo : voir les envois.`;

// Asked while a sync runs (Démarrer pressed meanwhile): sent right after it.
let sendAgain = false;

// Sends what waits, then refreshes the planning. quiet: no "Planning à jour".
export async function syncNow({ refresh = true, quiet = true } = {}) {
    if (state.syncing) {
        sendAgain = true;
        return;
    }
    state.syncing = true;
    updateStatus();
    try {
        await syncWithOdoo(refresh, quiet);
    } catch (error) {
        noteSyncError(error);
    } finally {
        state.syncing = false;
        updateStatus();
        app.rerender();
    }
    await sendAgainIfAsked();
}

async function sendAgainIfAsked() {
    if (sendAgain) {
        sendAgain = false;
        await syncNow({ refresh: false });
    }
}

async function syncWithOdoo(refresh, quiet) {
    const session = await store.checkSession();
    state.online = Boolean(session);
    state.needLogin = Boolean(session) && !session.logged;
    if (!session || !session.logged) {
        return;
    }
    state.known = true;
    const summary = await store.syncOutbox();
    toastSent(summary);
    if (refresh) {
        await store.refreshJobs();
        await store.refreshCatalog().catch((error) => console.warn("catalog", error));
    }
    if (!quiet && !summary.sent && !summary.failed) {
        toast("Planning à jour", "success", 2000);
    }
}

function toastSent(summary) {
    if (summary.sent) {
        toast(sentMessage(summary.sent), "success");
    }
    if (summary.failed) {
        toast(refusedMessage(summary.failed), "danger", 6000);
    }
}

function noteSyncError(error) {
    if (error instanceof store.NetworkError) {
        state.online = false;
    } else if (error instanceof store.SessionError) {
        state.needLogin = true;
    } else {
        console.error(error);
    }
}

export async function requestBackgroundSync() {
    try {
        const registration = await navigator.serviceWorker?.ready;
        if (registration && "sync" in registration) {
            await registration.sync.register("tech-outbox");
        }
    } catch {
        // Not on iOS/Firefox: the page sends the reports while it is open.
    }
}
