// "Consignes": contact notes, company instructions, descriptions (mission,
// appointment, intervention).
import { formattedHtml } from "../../../components/formatted_text.js";
import { foldHtml } from "../../../components/widgets.js";
import { esc } from "../../../utils/html.js";

export function notesFold(job, company) {
    const notes = [...job.notes, ...otherNotes(job, company)];
    const content = notes.map(
        (note) => `<div class="o_note"><b>${esc(note.label)}</b>${formattedHtml(note)}</div>`
    );
    return foldHtml("Consignes", notes.length, content.join(""));
}

function otherNotes(job, company) {
    const instructions = company && company.instructions;
    return [
        instructions && { label: "Consignes société", text: instructions },
        job.mission.description && {
            label: "Description de la mission",
            text: job.mission.description,
        },
        job.appointment_description && {
            label: "Description du rendez-vous",
            ...job.appointment_description,
        },
        job.description && {
            label: "Description de l'intervention",
            text: job.description,
            html: job.description_html,
        },
    ].filter(Boolean);
}
