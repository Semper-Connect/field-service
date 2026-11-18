// Report form. Saved as a draft on the phone at each change; validated, it
// goes to the outbox and is sent to Odoo when the network allows.
import { dom, store } from "../../core/env.js";
import { debounce } from "../../utils/debounce.js";
import { draftSaver, newDraft } from "./draft.js";
import { bindAttachments } from "./fields/attachments.js";
import { bindHours, lowestHours } from "./fields/hours.js";
import { bindSignature } from "./fields/signature.js";
import { bindStageChoice, initialStageId, reportStages } from "./fields/stage_choice.js";
import { bindSupplies } from "./fields/supplies.js";
import { reportHtml } from "./form.js";
import { bindSubmit } from "./submit.js";

const SAVE_DELAY_MS = 400;

export async function renderReport(id) {
    const report = await loadReport(id);
    dom.title.textContent = "Rapport d'intervention";
    dom.view.innerHTML = reportHtml(report);
    const saver = draftSaver(report.draft);
    bindFields(report, saver.save);
    bindSubmit(report, saver);
}

// The job, its draft (or a new one) and what the form needs to show.
async function loadReport(id) {
    const [job, savedDraft, catalog, company] = await Promise.all([
        store.getJob(id),
        store.getDraft(id),
        store.getCatalog(),
        store.getMeta("company"),
    ]);
    const draft = { ...newDraft(id), ...savedDraft };
    const [timer, currentStageId] = job
        ? await Promise.all([store.getTimer(job), store.getStageId(job)])
        : [null, null];
    const stages = reportStages(job, currentStageId);
    draft.stage_id = initialStageId(stages, job, draft.stage_id, currentStageId);
    const signatureMode = (company && company.signature_mode) || "optional";
    if (signatureMode === "hidden") {
        // A draft signed before the office hid the signature
        draft.signature = null;
        draft.signer_name = "";
    }
    return { id, job, draft, catalog, timer, stages, currentStageId, signatureMode };
}

function bindFields(report, save) {
    const saveSoon = debounce(save, SAVE_DELAY_MS);
    document.getElementById("notes").addEventListener("input", saveSoon);
    bindStageChoice(save);
    bindHours(report.draft, save, lowestHours(report));
    bindSupplies(report.draft, report.catalog, save);
    bindAttachments(report.draft, save);
    if (report.signatureMode !== "hidden") {
        document.getElementById("signer").addEventListener("input", saveSoon);
        bindSignature(report.draft, save);
    }
}
