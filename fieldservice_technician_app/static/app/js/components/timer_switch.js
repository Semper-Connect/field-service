// Démarrer while another timer runs: nothing changes until he decides.
import { dom } from "../core/env.js";
import { closeDialog } from "../core/ui.js";
import { esc } from "../utils/html.js";

const namesHtml = (others) => others.map((job) => `<strong>${esc(job.name)}</strong>`).join(", ");

const popupHtml = (others) => `
        <div class="o_popup" role="alertdialog" aria-modal="true" aria-labelledby="switch-title">
            <h3 class="o_popup_title" id="switch-title">Chronomètre déjà en cours</h3>
            <p class="o_popup_text">
                ${namesHtml(others)} est en cours. Il sera arrêté pour démarrer celui-ci.
            </p>
            <div class="o_popup_actions">
                <button class="btn btn-secondary" id="switch-cancel">Annuler</button>
                <button class="btn btn-action" id="switch-ok">Arrêter et démarrer</button>
            </div>
        </div>`;

// Resolves to true when he chooses to stop the others. A tap outside cancels.
export function confirmTimerSwitch(others) {
    dom.dialog.innerHTML = popupHtml(others);
    dom.dialog.classList.add("o_dialog_popup");
    dom.dialog.hidden = false;
    return new Promise((resolve) => {
        const answer = (accepted) => {
            dom.dialog.onclick = null;
            closeDialog();
            resolve(accepted);
        };
        dom.dialog.onclick = (event) => event.target === dom.dialog && answer(false);
        document.getElementById("switch-cancel").onclick = () => answer(false);
        document.getElementById("switch-ok").onclick = () => answer(true);
    });
}
