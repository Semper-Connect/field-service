// "Valider le rapport": checked, then put in the outbox and sent when the
// network allows.
import { store } from "../../core/env.js";
import { currentPosition } from "../../core/geo.js";
import { updateStatus } from "../../core/status.js";
import { requestBackgroundSync, syncNow } from "../../core/sync.js";
import { toast } from "../../core/ui.js";

export function bindSubmit(report, saver) {
    const button = document.getElementById("submit");
    button.onclick = async () => {
        button.disabled = true; // a double tap must not send it twice
        await saver.save();
        if (!isComplete(report.draft, report.signatureMode === "required")) {
            button.disabled = false;
            return;
        }
        saver.stop();
        await submit(report.draft, report.job);
    };
}

// Tells what is missing, and shows where.
function isComplete(draft, signatureRequired) {
    const missing = missingField(draft, signatureRequired);
    if (!missing) {
        return true;
    }
    const [message, id] = missing;
    toast(message, "warning");
    if (id === "sig") {
        document.getElementById(id).scrollIntoView({ block: "center" });
    } else {
        document.getElementById(id).focus();
    }
    return false;
}

// [message, id of the field], or null when complete.
function missingField(draft, signatureRequired) {
    const work = draft.notes.trim() || draft.photos.length || draft.files.length;
    if (!work && !draft.products.length) {
        return ["Décrivez les travaux, ajoutez une fourniture, une photo ou un fichier.", "notes"];
    }
    if (signatureRequired && !draft.signature) {
        return ["La signature du client est obligatoire.", "sig"];
    }
    if ((draft.signature || signatureRequired) && !draft.signer_name.trim()) {
        return ["Indiquez le nom du signataire.", "signer"];
    }
    return null;
}

async function submit(draft, job) {
    document.getElementById("submit").innerHTML =
        '<i class="fa fa-spinner fa-spin"></i> Localisation…';
    const position = await currentPosition(8000);
    await store.queueReport(draft, job, position);
    requestBackgroundSync();
    location.hash = "#/";
    if (navigator.onLine) {
        toast("Rapport enregistré, envoi en cours…");
        syncNow();
    } else {
        toast("Rapport enregistré. Il partira dès que le réseau revient.", "warning", 5000);
        updateStatus();
    }
}
