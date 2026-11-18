/* Public API of the store, for the page (core/env.js) and the service worker.
 * Loaded last: see db.js for the store files. */
(function (lib) {
    "use strict";

    const { get, getAll } = lib;

    globalThis.TechStore = {
        NetworkError: lib.NetworkError,
        SessionError: lib.SessionError,
        WAITING: lib.WAITING,
        getMeta: lib.getMeta,
        checkSession: lib.checkSession,
        refreshJobs: lib.refreshJobs,
        refreshCatalog: lib.refreshCatalog,
        refreshJob: lib.refreshJob,
        loadColleague: lib.loadColleague,
        loadBuildingContacts: (taskId) =>
            lib.rpc("/technician/api/building_contacts", { task_id: taskId }),
        loadDay: lib.loadDay,
        getCatalog: () => get("catalog", "data"),
        getJobs: () => getAll("jobs"),
        getJob: (id) => get("jobs", id),
        getDraft: (taskId) => get("drafts", taskId),
        getDrafts: () => getAll("drafts"),
        saveDraft: lib.saveDraft,
        queueReport: lib.queueReport,
        queueTimer: lib.queueTimer,
        queueRoute: lib.queueRoute,
        timerOf: lib.timerOf,
        getTimer: lib.getTimer,
        getRunningJobs: lib.getRunningJobs,
        getStageId: lib.getStageId,
        listOutbox: lib.listOutbox,
        retry: lib.retry,
        syncOutbox: lib.syncOutbox,
    };
})(globalThis.TechStoreLib);
