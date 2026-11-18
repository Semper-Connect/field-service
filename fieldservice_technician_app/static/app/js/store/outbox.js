/* Sending of the outbox: reports, Démarrer and Arrêter waiting for the network.
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { get, getAll, put, del, setMeta, notify } = lib;
    const { NetworkError, SessionError, rpc, checkSession, applyResult } = lib;

    const SENT_KEPT_DAYS = 7;
    // Statuses of the entries still to send ("sending": the app closed meanwhile)
    const WAITING = ["pending", "sending"];

    // In the order they were saved: two entries of the same millisecond
    // (Arrêter elsewhere, then Démarrer) are told apart by their seq.
    async function listOutbox() {
        const entries = await getAll("outbox");
        return entries.sort(
            (a, b) => a.created_at.localeCompare(b.created_at) || (a.seq || 0) - (b.seq || 0)
        );
    }

    async function retry(uuidValue) {
        const entry = await get("outbox", uuidValue);
        if (entry && entry.status === "error") {
            entry.status = "pending";
            entry.error = null;
            await put("outbox", entry);
            notify("outbox");
        }
    }

    async function pruneSent(maxAgeDays = SENT_KEPT_DAYS) {
        const limit = Date.now() - maxAgeDays * 86400000;
        const entries = await getAll("outbox");
        for (const e of entries) {
            if (e.status === "sent" && Date.parse(e.sent_at) < limit) {
                await del("outbox", e.uuid);
            }
        }
    }

    // "timer": Démarrer/Arrêter; "route": Itinéraire; "checkpoint": a stage
    // change queued by an older version of the app.
    function send(entry) {
        return entry.kind === "report"
            ? rpc("/technician/api/report", { report: entry.payload }, 120000)
            : rpc("/technician/api/checkpoint", { checkpoint: entry.payload });
    }

    // The photos are on the server now: free the phone's storage.
    function dropSentFiles(entry) {
        entry.photo_count = entry.payload.photos.length;
        entry.payload.photos = [];
        entry.payload.files = [];
        entry.payload.signature = entry.payload.signature ? "sent" : null;
    }

    let syncing = null;

    function syncOutbox() {
        if (!syncing) {
            const run = () => _syncOutbox().finally(() => (syncing = null));
            // The page and the service worker may both try at once.
            syncing =
                globalThis.navigator && navigator.locks
                    ? navigator.locks.request("tech-outbox-sync", run)
                    : run();
        }
        return syncing;
    }

    // Sends the waiting entries in order; stops at the first network or
    // session error, so they keep their order.
    async function _syncOutbox() {
        const summary = { sent: 0, failed: 0, remaining: 0, offline: false, needLogin: false };
        const pending = (await listOutbox()).filter((e) => WAITING.includes(e.status));
        if (!pending.length) {
            return summary;
        }
        const session = await checkSession().catch(() => null);
        if (!session || !session.logged) {
            return { ...summary, ...notSent(session, pending.length) };
        }
        await sendAll(pending, session, summary);
        return summary;
    }

    // Offline, or logged out: everything waits.
    function notSent(session, count) {
        return { offline: !session, needLogin: Boolean(session), remaining: count };
    }

    async function sendAll(pending, session, summary) {
        for (const entry of pending) {
            if (await sendEntry(entry, session, summary)) {
                summary.remaining = pending.length - summary.sent - summary.failed;
                return;
            }
        }
        await pruneSent();
    }

    // True when the network or the session stops the sync.
    async function sendEntry(entry, session, summary) {
        if (entry.uid && entry.uid !== session.uid) {
            summary.remaining++; // belongs to another technician: wait for them
            return false;
        }
        await markSending(entry);
        try {
            await deliver(entry);
            summary.sent++;
        } catch (e) {
            if (e instanceof NetworkError || e instanceof SessionError) {
                await keepPending(entry, e, summary);
                return true;
            }
            refuse(entry, e, summary);
        }
        await save(entry);
        return false;
    }

    async function markSending(entry) {
        entry.status = "sending";
        entry.attempts++;
        await save(entry);
    }

    // Refused by Odoo: set aside so it does not block the others.
    function refuse(entry, error, summary) {
        entry.status = "error";
        entry.error = error.message;
        summary.failed++;
    }

    async function deliver(entry) {
        const result = await send(entry);
        entry.status = "sent";
        entry.sent_at = new Date().toISOString();
        entry.result = result;
        if (result) {
            await applyResult(entry.task_id, result);
        }
        if (entry.kind === "report") {
            dropSentFiles(entry);
        }
    }

    // Not sent, to try again later.
    async function keepPending(entry, error, summary) {
        entry.status = "pending";
        entry.last_error = error.message;
        await save(entry);
        summary.offline = error instanceof NetworkError;
        summary.needLogin = error instanceof SessionError;
        if (summary.needLogin) {
            await setMeta("needLogin", true);
        }
    }

    async function save(entry) {
        await put("outbox", entry);
        notify("outbox");
    }

    Object.assign(lib, { WAITING, listOutbox, retry, syncOutbox });
})(globalThis.TechStoreLib);
