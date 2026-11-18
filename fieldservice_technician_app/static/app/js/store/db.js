/* Local database of the phone (IndexedDB).
 *
 * The store (js/store/*.js) is made of classic scripts, not modules: the
 * service worker loads them too, with importScripts. No DOM here. Each file
 * adds its functions to the private globalThis.TechStoreLib, read by the next
 * ones; index.js, loaded last, exposes the public globalThis.TechStore.
 * Loaded in this order by index.html and sw.js (same list in both):
 *   db.js, rpc.js                       database, calls to Odoo
 *   jobs.js, colleagues.js, days.js,    what Odoo sends
 *   catalog.js
 *   outbox.js                           sending what waits for the network
 *   entries.js, drafts.js, timer.js,    what the technician records
 *   route.js, reports.js
 *   index.js                            the public API */
(function (lib) {
    "use strict";

    const DB_NAME = "technician-app";
    const DB_VERSION = 2;
    const channel =
        typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tech-sync") : null;

    // Creates the stores missing in a database of an older version.
    function upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            db.createObjectStore("meta");
            db.createObjectStore("jobs", { keyPath: "id" });
            db.createObjectStore("drafts", { keyPath: "task_id" });
            const outbox = db.createObjectStore("outbox", { keyPath: "uuid" });
            outbox.createIndex("created_at", "created_at");
        }
        if (oldVersion < 2) {
            db.createObjectStore("catalog");
        }
    }

    let dbPromise = null;
    function openDB() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (event) => upgrade(req.result, event.oldVersion);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }
        return dbPromise;
    }

    function promisify(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function tx(storeNames, mode, fn) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const t = db.transaction(storeNames, mode);
            let result;
            Promise.resolve(fn(t)).then((r) => (result = r), reject);
            t.oncomplete = () => resolve(result);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error("Transaction aborted"));
        });
    }

    const get = (store, key) =>
        tx([store], "readonly", (t) => promisify(t.objectStore(store).get(key)));
    const getAll = (store) =>
        tx([store], "readonly", (t) => promisify(t.objectStore(store).getAll()));
    const put = (store, value, key) =>
        tx([store], "readwrite", (t) => promisify(t.objectStore(store).put(value, key)));
    const del = (store, key) =>
        tx([store], "readwrite", (t) => promisify(t.objectStore(store).delete(key)));

    const getMeta = (key) => get("meta", key);
    const setMeta = (key, value) => put("meta", value, key);

    // Tells the other tabs and the service worker that the data changed.
    function notify(what) {
        if (channel) {
            channel.postMessage({ type: "changed", what });
        }
    }

    function uuid() {
        if (globalThis.crypto && globalThis.crypto.randomUUID) {
            return globalThis.crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
    }

    Object.assign(lib, { tx, get, getAll, put, del, getMeta, setMeta, notify, uuid });
})((globalThis.TechStoreLib = globalThis.TechStoreLib || {}));
