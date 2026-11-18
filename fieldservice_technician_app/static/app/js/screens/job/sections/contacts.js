// "Contacts": who to call, each with a call button. The building's other
// contacts stay apart, in their own dialog.
import { avatarHtml, foldHtml } from "../../../components/widgets.js";
import { esc } from "../../../utils/html.js";
import { telUrl } from "../../../utils/links.js";

const CONTACT_ROLES = {
    onsite: "Contact sur place",
    resident: "Résident",
    requester: "Demandeur",
    manager: "Gestionnaire",
};

const BUILDING_BUTTON = `
        <button type="button" class="o_contact_more" id="building-contacts">
            <span class="o_contact_more_icon"><i class="fa fa-building-o"></i></span>
            <span class="o_contact_more_main">
                <span class="o_contact_more_title">Contacts de l'immeuble</span>
                <span class="o_contact_more_hint">Tous les contacts, par appartement</span>
            </span>
            <i class="fa fa-angle-right" data-arrow></i>
        </button>`;

export function contactsFold(job) {
    const contacts = job.contacts.map((contact) => contactHtml(contact)).join("");
    const button = job.has_building ? BUILDING_BUTTON : "";
    return foldHtml("Contacts", job.contacts.length, contacts + button);
}

// detail: what tells this contact apart, by default its role.
export function contactHtml(contact, detail = roleLabel(contact)) {
    const details = [detail, contact.phone].filter(Boolean).join(" · ");
    return `
        <div class="o_contact">
            ${avatarHtml(contact.name, contact.id)}
            <div class="o_contact_main">
                <div class="o_contact_name">${esc(contact.name)}</div>
                <div class="o_contact_role">${esc(details)}</div>
            </div>
            ${callButtonHtml(contact)}
        </div>`;
}

const roleLabel = (contact) => contact.label || CONTACT_ROLES[contact.role] || "";

function callButtonHtml(contact) {
    if (!contact.phone) {
        return "";
    }
    return `<a class="o_icon_btn" href="${telUrl(contact.phone)}"
              aria-label="Appeler ${esc(contact.name)}"><i class="fa fa-phone"></i></a>`;
}
