// "Fournitures déjà posées" on the task.
import { foldHtml } from "../../../components/widgets.js";
import { esc } from "../../../utils/html.js";

export function suppliesFold(job) {
    const supplies = job.supplies.map((s) => `<div>${esc(s.quantity)} × ${esc(s.name)}</div>`);
    return foldHtml("Fournitures déjà posées", supplies.length, supplies.join(""));
}
