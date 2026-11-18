/* Itinéraire: where he set off from, saved in the outbox like Démarrer.
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { put, notify, newEntry } = lib;

    // pressedAt: when he pressed it; the position may come a little later.
    async function queueRoute(job, position, pressedAt) {
        const entry = await newEntry("route", job, job.id);
        entry.payload = {
            uuid: entry.uuid,
            task_id: job.id,
            kind: "route",
            position,
            captured_at: pressedAt,
        };
        await put("outbox", entry);
        notify("outbox");
        return entry;
    }

    Object.assign(lib, { queueRoute });
})(globalThis.TechStoreLib);
