/* A colleague's whole planning, loaded when the technician opens it.
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { tx, notify, rpc, myJobIds, putReceivedJobs } = lib;

    // Changes one colleague of the "colleagues" meta, inside the transaction t.
    function updateColleague(t, colleagueId, update) {
        const meta = t.objectStore("meta");
        const request = meta.get("colleagues");
        request.onsuccess = () => {
            const colleagues = (request.result || []).map((c) =>
                c.id === colleagueId ? update(c) : c
            );
            meta.put(colleagues, "colleagues");
        };
    }

    async function loadColleague(colleagueId) {
        const result = await rpc("/technician/api/colleague", { user_id: colleagueId }, 30000);
        const mine = await myJobIds();
        await tx(["jobs", "meta"], "readwrite", (t) => {
            putReceivedJobs(t, result.jobs, mine);
            updateColleague(t, colleagueId, (c) => withWholePlanning(c, result));
        });
        notify("jobs");
    }

    // Days loaded one by one outside the window are kept.
    function withWholePlanning(colleague, result) {
        const received = new Set(result.appointments.map((a) => a.id));
        const unplanned = [...result.unplanned_ids, ...(colleague.unplanned_ids || [])];
        return {
            ...colleague,
            appointments: [
                ...result.appointments,
                ...colleague.appointments.filter((a) => !received.has(a.id)),
            ],
            unplanned_ids: [...new Set(unplanned)],
            loaded: true,
        };
    }

    Object.assign(lib, { updateColleague, loadColleague });
})(globalThis.TechStoreLib);
