// The building's contacts, one card per apartment, in the order Odoo sends
// them: the building's own contacts first, then by floor and apartment.
import { contactHtml } from "../screens/job/sections/contacts.js";
import { esc } from "../utils/html.js";
import { searchText } from "../utils/text.js";
import { emptyHtml } from "./widgets.js";

// "Étage 2 · Appt 21", else the apartment's name, else "Immeuble".
function unitTitle(contact) {
    const floor = contact.floor && `Étage ${contact.floor}`;
    const number = contact.apartment && `Appt ${contact.apartment}`;
    return [floor, number].filter(Boolean).join(" · ") || contact.unit || "Immeuble";
}

export function matchingContacts(contacts, query) {
    const words = searchText(query).split(/\s+/).filter(Boolean);
    return contacts.filter((contact) => {
        const text = searchText(contact.name, contact.label, contact.phone, unitTitle(contact));
        return words.every((word) => text.includes(word));
    });
}

function groupedByUnit(contacts) {
    const groups = new Map();
    for (const contact of contacts) {
        const title = unitTitle(contact);
        groups.set(title, [...(groups.get(title) || []), contact]);
    }
    return [...groups];
}

const groupHtml = ([title, contacts]) => `
        <section class="o_unit">
            <h4 class="o_unit_title">${esc(title)}</h4>
            <div class="o_unit_card">
                ${contacts.map((contact) => contactHtml(contact, contact.label)).join("")}
            </div>
        </section>`;

export function contactsListHtml(contacts, searching) {
    if (contacts.length) {
        return groupedByUnit(contacts).map(groupHtml).join("");
    }
    return searching
        ? emptyHtml("fa-search", "Aucun résultat", "Essayez un autre nom ou appartement.")
        : emptyHtml("fa-building-o", "Aucun contact", "Aucun contact lié à cet immeuble.");
}
