// Shared by every screen: the store, the page's fixed elements and the
// state of the app. No behaviour here (see ui.js, status.js).
export const store = globalThis.TechStore; // js/store/, loaded before the modules

export const dom = {
    view: document.getElementById("view"),
    title: document.getElementById("title"),
    back: document.getElementById("back"),
    appIcon: document.getElementById("app-icon"),
    banner: document.getElementById("banner"),
    pill: document.getElementById("netpill"),
    pillLabel: document.getElementById("netpill-label"),
    toast: document.getElementById("toast"),
    dialog: document.getElementById("dialog"),
};

export const state = {
    online: navigator.onLine,
    syncing: false,
    needLogin: false,
    known: false, // a technician has already logged in on this device
    route: null,
    day: null, // day shown (YYYY-MM-DD), today by default
    who: "me", // "me" or a colleague's user id
    searching: false,
    search: "",
    openUnplanned: false,
};

// Set by router.js.
export const app = { rerender: () => {} };

export const LOGIN_URL = "/web/login?redirect=/technician/";
