// "Envois": what waits for the network, what was sent or refused.
import { emptyHtml } from "../../components/widgets.js";
import { dom, store } from "../../core/env.js";
import { syncNow } from "../../core/sync.js";
import { entryHtml } from "./entry.js";

export async function renderOutbox() {
    dom.title.textContent = "Envois";
    const [outbox, uid] = await Promise.all([store.listOutbox(), store.getMeta("uid")]);
    const entries = outbox.reverse();
    dom.view.innerHTML = `
        ${statsHtml(entries)}
        <div class="o_day_list">${listHtml(entries, uid)}</div>
        <div class="o_sticky_footer">
            <button class="btn btn-secondary" id="sync">
                <i class="fa fa-cloud-upload"></i> Envoyer maintenant
            </button>
        </div>`;
    bindOutbox();
}

function statsHtml(entries) {
    const count = (statuses) => entries.filter((e) => statuses.includes(e.status)).length;
    return `
        <div class="o_stats">
            <div class="o_stat"><b>${count(store.WAITING)}</b><span>À envoyer</span></div>
            <div class="o_stat"><b>${count(["sent"])}</b><span>Envoyés</span></div>
            <div class="o_stat"><b>${count(["error"])}</b><span>Refusés</span></div>
        </div>`;
}

function listHtml(entries, uid) {
    if (!entries.length) {
        return emptyHtml(
            "fa-inbox",
            "Rien à envoyer",
            "Les rapports validés, Démarrer, Arrêter et Itinéraire apparaissent ici."
        );
    }
    return entries.map((entry) => entryHtml(entry, uid)).join("");
}

function bindOutbox() {
    for (const button of dom.view.querySelectorAll("[data-retry]")) {
        button.onclick = async () => {
            await store.retry(button.dataset.retry);
            syncNow({ refresh: false });
        };
    }
    document.getElementById("sync").onclick = () => syncNow({ refresh: false, quiet: false });
}
