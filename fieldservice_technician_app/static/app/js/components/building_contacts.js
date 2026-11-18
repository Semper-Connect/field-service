// "Contacts de l'immeuble": asked for from the sheet, with the network only.
// Shown in a dialog and forgotten when it closes, never kept on the phone.
import { dom, store } from "../core/env.js";
import { closeDialog, toast } from "../core/ui.js";
import { esc } from "../utils/html.js";
import { contactsListHtml, matchingContacts } from "./building_contacts_list.js";

// Fewer contacts fit on the screen: no search needed.
const SEARCH_FROM = 6;

export function bindBuildingContacts(job) {
    const button = document.getElementById("building-contacts");
    if (button) {
        button.onclick = () => openBuildingContacts(job, button);
    }
}

async function openBuildingContacts(job, button) {
    if (!navigator.onLine) {
        toast("Contacts de l'immeuble : disponibles avec du réseau.", "warning");
        return;
    }
    const arrow = button.querySelector("[data-arrow]");
    button.disabled = true;
    arrow.className = "fa fa-spinner fa-spin";
    try {
        showContacts(await store.loadBuildingContacts(job.id));
    } catch {
        toast("Contacts de l'immeuble non disponibles. Réessayez.", "warning");
    } finally {
        button.disabled = false;
        arrow.className = "fa fa-angle-right";
    }
}

function showContacts({ building, contacts }) {
    const list = contacts || [];
    dom.dialog.innerHTML = dialogHtml(building, list);
    dom.dialog.hidden = false;
    document.getElementById("dlg-close").onclick = closeDialog;
    drawList(list, "");
    bindSearch(list);
}

function bindSearch(contacts) {
    const input = document.getElementById("dlg-search");
    if (input) {
        input.addEventListener("input", () => drawList(contacts, input.value));
    }
}

function drawList(contacts, query) {
    const found = matchingContacts(contacts, query);
    document.getElementById("dlg-body").innerHTML = contactsListHtml(found, Boolean(query));
}

// "SDC 18 rue des Volontaires · 6 contacts"
function subtitle(building, contacts) {
    const count = contacts.length;
    const label = `${count} contact${count > 1 ? "s" : ""}`;
    return [building, label].filter(Boolean).join(" · ");
}

const searchHtml = () => `
        <div class="o_control_panel">
            <label class="o_searchview">
                <i class="fa fa-search"></i>
                <input id="dlg-search" type="search" placeholder="Nom, appartement, étage…"/>
            </label>
        </div>`;

const dialogHtml = (building, contacts) => `
        <div class="o_dialog_header">
            <button class="o_navbar_back" id="dlg-close" aria-label="Fermer">
                <i class="fa fa-arrow-left"></i></button>
            <div class="o_building_title">
                <h3>Contacts de l'immeuble</h3>
                <div>${esc(subtitle(building, contacts))}</div>
            </div>
        </div>
        ${contacts.length >= SEARCH_FROM ? searchHtml() : ""}
        <div class="o_dialog_body o_building_contacts" id="dlg-body"></div>`;
