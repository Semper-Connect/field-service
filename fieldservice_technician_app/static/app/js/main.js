// Screens render from the local database; the network only refreshes it.
import { app, dom, state, store } from "./core/env.js";
import { updateStatus } from "./core/status.js";
import { syncNow } from "./core/sync.js";
import { goBack, render } from "./router.js";
import { installSwipe } from "./screens/planning/swipe.js";

const RETRY_EVERY_MS = 60000;
// Back from a call or the itinerary: the planning is downloaded again only
// if older than this. The outbox is sent at once anyway.
const REFRESH_ON_SHOW_MS = 60000;

function goOnline() {
    state.online = true;
    syncNow();
}

function goOffline() {
    state.online = false;
    updateStatus();
}

async function onShow() {
    if (document.visibilityState !== "visible") {
        return;
    }
    const lastSync = Date.parse(await store.getMeta("lastJobsSync")) || 0;
    syncNow({ refresh: Date.now() - lastSync > REFRESH_ON_SHOW_MS });
}

// Reports sent by the service worker or another tab.
function listenToOtherTabs() {
    if (typeof BroadcastChannel === "undefined") {
        return;
    }
    new BroadcastChannel("tech-sync").onmessage = () => {
        updateStatus();
        app.rerender();
    };
}

async function retryWaiting() {
    const outbox = await store.listOutbox();
    const waiting = outbox.some((entry) => store.WAITING.includes(entry.status));
    if (waiting && document.visibilityState === "visible") {
        syncNow({ refresh: false });
    }
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }
    navigator.serviceWorker
        .register("/technician/sw.js", { scope: "/technician/" })
        .catch((error) => console.warn("Service worker not registered", error));
}

async function start() {
    state.known = Boolean(await store.getMeta("uid"));
    state.needLogin = Boolean(await store.getMeta("needLogin"));
    await updateStatus();
    await render(); // instant, from local data
    await syncNow(); // then refresh from the server if reachable
}

dom.back.addEventListener("click", goBack);
window.addEventListener("hashchange", render);
window.addEventListener("online", goOnline);
window.addEventListener("offline", goOffline);
document.addEventListener("visibilitychange", onShow);
listenToOtherTabs();
setInterval(retryWaiting, RETRY_EVERY_MS);
registerServiceWorker();
// Keep the offline data when the phone runs out of storage.
navigator.storage?.persist?.().catch(() => {});
installSwipe();
start();
