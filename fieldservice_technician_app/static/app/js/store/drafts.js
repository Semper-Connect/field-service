/* Report drafts, saved on the phone at each change. See db.js for the store files. */
(function (lib) {
    "use strict";

    const { put, notify } = lib;

    async function saveDraft(draft) {
        draft.updated_at = new Date().toISOString();
        await put("drafts", draft);
        notify("drafts");
    }

    Object.assign(lib, { saveDraft });
})(globalThis.TechStoreLib);
