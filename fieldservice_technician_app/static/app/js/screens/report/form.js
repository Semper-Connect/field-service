// The report form, each field from its own file in fields/.
import { esc } from "../../utils/html.js";
import { attachmentsFieldHtml } from "./fields/attachments.js";
import { hoursFieldHtml } from "./fields/hours.js";
import { signatureFieldHtml } from "./fields/signature.js";
import { stageChoiceHtml } from "./fields/stage_choice.js";
import { suppliesFieldHtml } from "./fields/supplies.js";

const NOTES_PLACEHOLDER = "Constat, travaux effectués, pièces remplacées, remarques…";

export function reportHtml(report) {
    const { draft, timer, stages, currentStageId } = report;
    return `
        <div class="o_form_sheet">
            ${headerHtml(report)}
            ${notesFieldHtml(draft)}
            ${attachmentsFieldHtml()}
            ${suppliesFieldHtml()}
            ${hoursFieldHtml(draft.hours, timer, report.job)}
            ${signatureFieldHtml(draft, report.signatureMode)}
            ${stageChoiceHtml(stages, draft.stage_id, currentStageId)}
            <p class="o_hint" id="saved-hint"><i class="fa fa-mobile"></i> Brouillon enregistré sur le téléphone</p>
        </div>
        <div class="o_sticky_footer">
            <button class="btn btn-primary" id="submit"><i class="fa fa-check"></i> Valider le rapport</button>
        </div>`;
}

// Mission and street, then the intervention.
function headerHtml({ id, job }) {
    const context = job
        ? [job.mission.name, job.place.street].filter(Boolean).join(" · ")
        : `#${id}`;
    return `
            <div class="o_form_meta">${esc(context)}</div>
            <h1 class="o_form_title">${esc(job ? job.name : "Intervention")}</h1>`;
}

const notesFieldHtml = (draft) => `
            <div class="o_field">
                <label class="o_label" for="notes">Travaux réalisés</label>
                <div class="o_field_hint">Requis : une description, une fourniture, une photo ou un fichier.</div>
                <textarea class="o_input" id="notes"
                          placeholder="${NOTES_PLACEHOLDER}">${esc(draft.notes)}</textarea>
            </div>`;
