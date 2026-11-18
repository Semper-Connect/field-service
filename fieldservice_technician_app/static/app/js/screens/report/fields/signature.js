// "Signature du client": signer's name and the pad.
import { signaturePad } from "../../../components/signature_pad.js";
import { esc } from "../../../utils/html.js";

// mode: "required", "optional" or "hidden" (Project settings).
export const signatureFieldHtml = (draft, mode) =>
    mode === "hidden" ? "" : signatureHtml(draft, mode === "required");

const signatureHtml = (draft, required) => `
            <div class="o_field">
                <span class="o_label">Signature du client${required ? " *" : ""}</span>
                <input class="o_input o_signer" id="signer" placeholder="Nom du signataire"
                       value="${esc(draft.signer_name)}"/>
                <div class="o_signature">
                    <canvas id="sig"></canvas>
                    <div class="o_signature_hint">Signer ici</div>
                </div>
                <div class="o_signature_actions">
                    <button type="button" class="o_link_btn" id="sig-clear">
                        <i class="fa fa-eraser"></i> Effacer</button>
                </div>
            </div>`;

export function bindSignature(draft, save) {
    const pad = signaturePad(document.getElementById("sig"), draft.signature, (dataUrl) => {
        draft.signature = dataUrl;
        save();
    });
    document.getElementById("sig-clear").onclick = () => {
        pad.clear();
        draft.signature = null;
        save();
    };
}
