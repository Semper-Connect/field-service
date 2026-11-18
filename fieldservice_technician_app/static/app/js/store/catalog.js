/* Supplies catalog, downloaded again only when Odoo has a new version.
 * See db.js for the store files. */
(function (lib) {
    "use strict";

    const { get, put, notify, rpc } = lib;

    async function refreshCatalog() {
        const current = await get("catalog", "data");
        const version = current ? current.version : null;
        const result = await rpc("/technician/api/catalog", { version }, 60000);
        if (!result.unchanged) {
            await put("catalog", result, "data");
            notify("catalog");
        }
        return result;
    }

    Object.assign(lib, { refreshCatalog });
})(globalThis.TechStoreLib);
