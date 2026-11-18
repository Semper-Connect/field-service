/* Démarrer and Arrêter: saved in the outbox first, like a report, and his
 * timer on each job as the phone knows it. See db.js for the store files. */
(function (lib) {
    "use strict";

    const { getAll, put, notify, listOutbox, newEntry, waitingOf } = lib;

    // Stopped at once, Odoo keeps one minute (technician.checkpoint, timer.py).
    const MIN_HOURS = 1 / 60;

    // action: "start" (Démarrer) or "stop" (Arrêter).
    async function queueTimer(job, action, position) {
        const entry = { ...(await newEntry("timer", job, job.id)), timer: action };
        entry.payload = {
            uuid: entry.uuid,
            task_id: job.id,
            kind: action,
            position,
            captured_at: entry.created_at,
        };
        await put("outbox", entry);
        notify("outbox");
        return entry;
    }

    const hoursBetween = (start, end) =>
        Math.max(MIN_HOURS, (Date.parse(end) - Date.parse(start)) / 3600000);

    // His timer on the job: Odoo's, then what the outbox has not sent yet.
    // runningSince: ISO date or null; timedHours: stopped since his last report.
    function timerOf(job, outbox) {
        const timer = job.timer || {};
        let runningSince = timer.running_since || null;
        let timedHours = timer.timed_hours || 0;
        for (const entry of waitingOf(job, outbox)) {
            if (entry.kind === "report") {
                runningSince = null; // the report stops it
                timedHours = 0;
            } else if (entry.kind === "timer" && entry.timer === "start") {
                runningSince = runningSince || entry.created_at;
            } else if (entry.kind === "timer" && runningSince) {
                timedHours += hoursBetween(runningSince, entry.created_at);
                runningSince = null;
            }
        }
        return { runningSince, timedHours };
    }

    async function getTimer(job) {
        return timerOf(job, await listOutbox());
    }

    // His interventions with a running timer: Démarrer elsewhere stops them.
    async function getRunningJobs() {
        const [jobs, outbox] = await Promise.all([getAll("jobs"), listOutbox()]);
        return jobs.filter((job) => timerOf(job, outbox).runningSince);
    }

    Object.assign(lib, { queueTimer, timerOf, getTimer, getRunningJobs });
})(globalThis.TechStoreLib);
