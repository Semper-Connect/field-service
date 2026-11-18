// Planning not kept on the phone, loaded from Odoo when it is opened online,
// once per planning refresh (which drops it again).
import { store } from "../../core/env.js";
import { toast } from "../../core/ui.js";

// A colleague's whole planning. True while it loads.
const colleagueLoads = new Set();
export function loadColleague(colleague, lastSync, onLoaded) {
    const key = `${colleague.id}@${lastSync}`;
    if (colleague.loaded || colleagueLoads.has(key) || !navigator.onLine) {
        return false;
    }
    colleagueLoads.add(key);
    store
        .loadColleague(colleague.id)
        .then(onLoaded)
        .catch(() => {
            colleagueLoads.delete(key); // tried again at the next display
            toast("Planning de collègue non chargé : réessayez avec du réseau.", "warning");
        });
    return true;
}

// A day outside the window: "loading", "failed" or undefined.
const dayLoads = new Map();
export function loadDay(day, colleague, lastSync, onDone) {
    const key = `${colleague ? colleague.id : "me"}@${day}@${lastSync}`;
    if (!dayLoads.has(key) && navigator.onLine) {
        dayLoads.set(key, "loading");
        store
            .loadDay(day, colleague ? colleague.id : false)
            .catch(() => dayLoads.set(key, "failed")) // tried again at the next refresh
            .then(onDone);
    }
    return dayLoads.get(key);
}
