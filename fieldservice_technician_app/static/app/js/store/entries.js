/* Outbox entries as the technician records them: Démarrer/Arrêter
 * (timer.js), Itinéraire (route.js) and reports (reports.js).
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { getMeta, uuid, WAITING } = lib;

    // Saving order of the outbox entries, also within one millisecond.
    let counter = 0;
    const nextSeq = () => Date.now() * 1000 + (counter++ % 1000);

    // Shown in the outbox, even once the intervention left the phone.
    function taskInfo(job, taskId) {
        return {
            task_id: taskId,
            task_name: job ? job.name : `#${taskId}`,
            mission: job ? job.mission.name : "",
            place: job ? [job.place.street, job.place.city].filter(Boolean).join(", ") : "",
        };
    }

    // The fields every entry has; "kind" is "timer", "route" or "report".
    async function newEntry(kind, job, taskId) {
        return {
            uuid: uuid(),
            uid: await getMeta("uid"),
            kind,
            seq: nextSeq(),
            ...taskInfo(job, taskId),
            created_at: new Date().toISOString(),
            status: "pending", // pending | sending | sent | error
            attempts: 0,
            error: null,
        };
    }

    // Entries of the task not sent yet, oldest first.
    const waitingOf = (job, outbox) =>
        outbox.filter((e) => e.task_id === job.id && WAITING.includes(e.status));

    Object.assign(lib, { newEntry, waitingOf });
})(globalThis.TechStoreLib);
