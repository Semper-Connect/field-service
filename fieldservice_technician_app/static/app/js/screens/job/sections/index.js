// The folded sections of the intervention sheet, in their order. Mission
// only when the office shows it (Project settings).
import { documentsFold } from "../../../components/documents.js";
import { chatterFold } from "./chatter.js";
import { contactsFold } from "./contacts.js";
import { missionFold } from "./mission.js";
import { notesFold } from "./notes.js";
import { suppliesFold } from "./supplies.js";

export function foldsHtml(job, company) {
    return `
        <div class="o_folds">
            ${notesFold(job, company)}
            ${chatterFold(job)}
            ${documentsFold(job)}
            ${contactsFold(job)}
            ${company && company.show_mission ? missionFold(job) : ""}
            ${suppliesFold(job)}
        </div>`;
}
