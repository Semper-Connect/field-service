/* Days outside the planning window, his or a colleague's, loaded online when
 * opened and kept until the next planning refresh. See db.js for the store files. */
(function (lib) {
    "use strict";

    const { tx, notify, rpc, myJobIds, putReceivedJobs, updateColleague } = lib;

    async function loadDay(day, colleagueId) {
        const params = { day, user_id: colleagueId || false };
        const result = await rpc("/technician/api/day", params, 20000);
        const mine = await myJobIds();
        await tx(["jobs", "meta"], "readwrite", (t) => {
            putReceivedJobs(t, result.jobs, mine);
            markDayLoaded(t, `${colleagueId || "me"}@${day}`);
            if (colleagueId) {
                updateColleague(t, colleagueId, (c) => withColleagueDay(c, result));
            }
        });
        notify("jobs");
    }

    // "me@2026-10-02" or "9@2026-10-02": not to load it again.
    function markDayLoaded(t, key) {
        const meta = t.objectStore("meta");
        const loaded = meta.get("loadedDays");
        loaded.onsuccess = () => {
            meta.put([...new Set([...(loaded.result || []), key])], "loadedDays");
        };
    }

    // The colleague's appointments and tasks of the day, added to his planning.
    function withColleagueDay(colleague, result) {
        const known = new Set(colleague.appointments.map((a) => a.id));
        const unplanned = [...(colleague.unplanned_ids || []), ...result.unplanned_ids];
        return {
            ...colleague,
            appointments: [
                ...colleague.appointments,
                ...result.appointments.filter((a) => !known.has(a.id)),
            ],
            unplanned_ids: [...new Set(unplanned)],
        };
    }

    Object.assign(lib, { loadDay });
})(globalThis.TechStoreLib);
