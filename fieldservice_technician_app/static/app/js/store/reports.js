/* Validated reports, put in the outbox in place of their draft.
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { tx, notify, stageName, listOutbox, newEntry, waitingOf } = lib;

    async function queueReport(draft, job, position) {
        const entry = {
            ...(await newEntry("report", job, draft.task_id)),
            stage_name: stageName(job, draft.stage_id),
        };
        entry.payload = { ...reportPayload(draft, position), uuid: entry.uuid };
        // One transaction: the report is never both queued and a draft.
        await tx(["outbox", "drafts"], "readwrite", (t) => {
            t.objectStore("outbox").put(entry);
            t.objectStore("drafts").delete(draft.task_id);
        });
        notify("outbox");
        return entry;
    }

    // What Odoo receives (technician.report, submit.py).
    function reportPayload(draft, position) {
        return {
            task_id: draft.task_id,
            notes: draft.notes || "",
            hours: Number(draft.hours) || 0,
            stage_id: draft.stage_id || null,
            products: (draft.products || []).map((p) => ({
                product_id: p.product_id,
                quantity: p.quantity,
            })),
            photos: draft.photos || [],
            files: draft.files || [],
            signature: draft.signature || null,
            signer_name: draft.signer_name || "",
            captured_at: new Date().toISOString(),
            position,
        };
    }

    // Stage chosen on the phone and not sent yet, else the one known by Odoo.
    async function getStageId(job) {
        const chosen = waitingOf(job, await listOutbox()).filter((e) => e.payload.stage_id);
        return chosen.length ? chosen[chosen.length - 1].payload.stage_id : job.stage_id;
    }

    Object.assign(lib, { queueReport, getStageId });
})(globalThis.TechStoreLib);
