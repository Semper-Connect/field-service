// The report being filled in: saved on the phone at each change.
import { store } from "../../core/env.js";
import { checkedStageId } from "./fields/stage_choice.js";

export const newDraft = (taskId) => ({
    task_id: taskId,
    notes: "",
    hours: 0,
    products: [],
    photos: [],
    files: [],
    signature: null,
    signer_name: "",
    stage_id: null,
});

// save(): reads the form into the draft and stores it. stop(): once
// validated, the draft is the report: a late autosave must not bring it back.
export function draftSaver(draft) {
    let submitted = false;
    const save = async () => {
        if (submitted) {
            return;
        }
        readForm(draft);
        await store.saveDraft(draft);
        showSaved();
    };
    return { save, stop: () => (submitted = true) };
}

// The text fields and the stage; the other fields change the draft themselves.
// No signer field when the office hides the signature (Project settings).
function readForm(draft) {
    const signer = document.getElementById("signer");
    draft.notes = document.getElementById("notes").value;
    draft.signer_name = signer ? signer.value : "";
    draft.stage_id = checkedStageId();
}

function showSaved() {
    const at = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    document.getElementById(
        "saved-hint"
    ).innerHTML = `<i class="fa fa-mobile"></i> Brouillon enregistré sur le téléphone · ${at}`;
}
