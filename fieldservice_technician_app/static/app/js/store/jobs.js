/* His interventions, refreshed from Odoo. See db.js for the store files. */
(function (lib) {
    "use strict";

    const { tx, get, getAll, put, notify, rpc } = lib;

    // His own interventions (a colleague's are sent with mine: false).
    async function myJobIds() {
        return new Set((await getAll("jobs")).filter((j) => j.mine !== false).map((j) => j.id));
    }

    // Jobs received outside the planning (a day, a colleague): his own always,
    // a colleague's unless it is one of his.
    function putReceivedJobs(t, jobs, mine) {
        const store = t.objectStore("jobs");
        for (const job of jobs) {
            if (job.mine !== false || !mine.has(job.id)) {
                store.put(job);
            }
        }
    }

    // A colleague's planning loaded on demand is dropped here, but never an
    // intervention with a draft or something not sent yet.
    async function refreshJobs() {
        const result = await rpc("/technician/api/jobs", {}, 20000);
        const kept = await jobsInUse(result.jobs);
        await tx(["jobs", "meta"], "readwrite", (t) => {
            replaceJobs(t, [...result.jobs, ...kept]);
            savePlanningMeta(t, result);
        });
        notify("jobs");
        return result.jobs;
    }

    // Jobs left out of the planning received, but with a draft or an entry to send.
    async function jobsInUse(received) {
        const [jobs, drafts, outbox] = await Promise.all([
            getAll("jobs"),
            getAll("drafts"),
            getAll("outbox"),
        ]);
        const inUse = new Set([
            ...drafts.map((d) => d.task_id),
            ...outbox.filter((e) => e.status !== "sent").map((e) => e.task_id),
        ]);
        const receivedIds = new Set(received.map((job) => job.id));
        return jobs.filter((job) => inUse.has(job.id) && !receivedIds.has(job.id));
    }

    function replaceJobs(t, jobs) {
        const store = t.objectStore("jobs");
        store.clear();
        for (const job of jobs) {
            store.put(job);
        }
    }

    function savePlanningMeta(t, result) {
        const meta = t.objectStore("meta");
        meta.put(new Date().toISOString(), "lastJobsSync");
        meta.put(result.uid, "uid");
        meta.put(result.company, "company");
        meta.put(result.window, "window");
        meta.put(result.colleagues, "colleagues");
        meta.put([], "loadedDays");
    }

    // The open intervention only. True when Odoo had something new.
    async function refreshJob(id) {
        const result = await rpc("/technician/api/job", { task_id: id }, 8000);
        if (!result.job) {
            return false;
        }
        const current = await get("jobs", id);
        if (current && JSON.stringify(current) === JSON.stringify(result.job)) {
            return false;
        }
        await put("jobs", result.job);
        notify("jobs");
        return true;
    }

    function stageName(job, stageId) {
        const stage = job && (job.stages || []).find((s) => s.id === stageId);
        return stage ? stage.name : "";
    }

    // The stage and timer Odoo has after a send, until the next jobs refresh.
    async function applyResult(taskId, result) {
        await tx(["jobs"], "readwrite", (t) => {
            const jobs = t.objectStore("jobs");
            const request = jobs.get(taskId);
            request.onsuccess = () => {
                if (request.result) {
                    jobs.put(withResult(request.result, result));
                }
            };
        });
        notify("jobs");
    }

    function withResult(job, result) {
        if (result.stage_id) {
            job.stage_id = result.stage_id;
            job.stage = stageName(job, result.stage_id) || job.stage;
        }
        if (result.timer) {
            job.timer = result.timer;
        }
        return job;
    }

    Object.assign(lib, {
        myJobIds,
        putReceivedJobs,
        refreshJobs,
        refreshJob,
        stageName,
        applyResult,
    });
})(globalThis.TechStoreLib);
