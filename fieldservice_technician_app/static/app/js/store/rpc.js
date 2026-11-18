/* Calls to Odoo (JSON-RPC) and the session check. See db.js for the store files. */
(function (lib) {
    "use strict";

    const { tx, getMeta, setMeta, notify } = lib;

    // No network, or Odoo unreachable: try again later.
    class NetworkError extends Error {}
    class SessionError extends Error {}
    // Refused by Odoo: retrying will not help.
    class ServerError extends Error {}

    async function rpc(url, params = {}, timeoutMs = 30000) {
        const response = await post(url, params, timeoutMs);
        const body = await readBody(response);
        if (body.error) {
            throw rpcError(body.error);
        }
        return body.result;
    }

    // The request, given up after timeoutMs.
    async function post(url, params, timeoutMs) {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller && setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: Date.now(), params }),
                signal: controller && controller.signal,
            });
        } catch (e) {
            throw new NetworkError(e.message || "Network error");
        } finally {
            clearTimeout(timer);
        }
    }

    async function readBody(response) {
        if (response.status >= 500 || response.status === 0) {
            // Proxy errors while Odoo restarts: try again later.
            throw new NetworkError(`HTTP ${response.status}`);
        }
        try {
            return await response.json();
        } catch {
            throw new NetworkError(`Invalid response (HTTP ${response.status})`);
        }
    }

    function rpcError(error) {
        const data = error.data || {};
        if (error.code === 100 || data.name === "odoo.http.SessionExpiredException") {
            return new SessionError("Session expired");
        }
        return new ServerError(data.message || error.message || "Server error");
    }

    /** {logged, uid, name}, or null when offline. */
    async function checkSession() {
        let session;
        try {
            session = await rpc("/technician/api/session", {}, 8000);
        } catch (e) {
            if (e instanceof NetworkError) {
                return null;
            }
            throw e;
        }
        await rememberSession(session);
        notify("session");
        return session;
    }

    async function rememberSession(session) {
        if (!session.logged) {
            await setMeta("needLogin", true);
            return;
        }
        const previousUid = await getMeta("uid");
        if (previousUid && previousUid !== session.uid) {
            await forgetPreviousTechnician();
        }
        await setMeta("uid", session.uid);
        await setMeta("needLogin", false);
    }

    // Another technician on this phone: his unsent reports stay queued.
    function forgetPreviousTechnician() {
        return tx(["jobs", "drafts", "catalog"], "readwrite", (t) => {
            t.objectStore("jobs").clear();
            t.objectStore("drafts").clear();
            t.objectStore("catalog").clear();
        });
    }

    Object.assign(lib, { NetworkError, SessionError, ServerError, rpc, checkSession });
})(globalThis.TechStoreLib);
