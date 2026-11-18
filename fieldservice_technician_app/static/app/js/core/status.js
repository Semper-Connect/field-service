// Network chip of the top bar and the banner under it.
import { dom, LOGIN_URL, state, store } from "./env.js";

const BANNERS = {
    login: [
        "warning",
        `<i class="fa fa-lock"></i> Session expirée. Vos rapports restent sur le téléphone.
            <a href="${LOGIN_URL}">Se reconnecter</a>`,
    ],
    offline: [
        "info",
        `<i class="fa fa-plane"></i> Hors ligne : remplissez vos rapports, ils partiront automatiquement.`,
    ],
};

export async function updateStatus() {
    const outbox = await store.listOutbox();
    const waiting = outbox.filter((e) => store.WAITING.includes(e.status)).length;
    const refused = outbox.filter((e) => e.status === "error").length;
    dom.pill.classList.toggle("offline", !state.online);
    dom.pill.classList.toggle("waiting", waiting > 0 || refused > 0);
    dom.pill.classList.toggle("syncing", state.syncing);
    dom.pillLabel.textContent = pillLabel(waiting, refused);
    showBanner(currentBanner());
}

// "En ligne · 2 à envoyer", "Hors ligne · 1 refusé"...
function pillLabel(waiting, refused) {
    const label = state.online ? "En ligne" : "Hors ligne";
    if (waiting) {
        return `${label} · ${waiting} à envoyer`;
    }
    if (refused) {
        return `${label} · ${refused} refusé${refused > 1 ? "s" : ""}`;
    }
    return label;
}

function currentBanner() {
    if (state.needLogin && state.known) {
        return BANNERS.login;
    }
    return state.online ? null : BANNERS.offline;
}

function showBanner(banner) {
    dom.banner.hidden = !banner;
    if (banner) {
        dom.banner.className = `o_banner ${banner[0]}`;
        dom.banner.innerHTML = banner[1];
    }
}
