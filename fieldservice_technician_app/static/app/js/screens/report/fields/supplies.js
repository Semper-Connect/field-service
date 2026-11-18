// "Fournitures": saved as project.task.pack lines on the task.
import { openSupplyPicker } from "../../../components/supply_picker.js";
import { thumbHtml } from "../../../components/widgets.js";
import { esc } from "../../../utils/html.js";

export const suppliesFieldHtml = () => `
            <div class="o_field">
                <span class="o_label">Fournitures</span>
                <div class="o_list" id="supplies"></div>
            </div>`;

export function bindSupplies(draft, catalog, save) {
    const products = new Map((catalog ? catalog.products : []).map((p) => [p.id, p]));
    const changed = () => {
        drawSupplies(draft, products, changed, catalog);
        save();
    };
    drawSupplies(draft, products, changed, catalog);
}

function drawSupplies(draft, products, changed, catalog) {
    const container = document.getElementById("supplies");
    const lines = draft.products.map((line, index) => lineHtml(line, index, products));
    container.innerHTML = `
            ${lines.join("") || '<div class="o_list_empty">Aucune fourniture.</div>'}
            <button type="button" class="o_add_line" id="add-supply">
                <i class="fa fa-plus"></i> Ajouter une fourniture</button>`;
    for (const button of container.querySelectorAll("[data-qty]")) {
        button.onclick = () => {
            addQuantity(draft, Number(button.dataset.index), Number(button.dataset.qty));
            changed();
        };
    }
    document.getElementById("add-supply").onclick = () =>
        openSupplyPicker(catalog, draft.products, changed);
}

// A line at 0 is removed.
function addQuantity(draft, index, step) {
    draft.products[index].quantity += step;
    if (draft.products[index].quantity <= 0) {
        draft.products.splice(index, 1);
    }
}

function lineHtml(line, index, products) {
    const product = products.get(line.product_id);
    const code = product && product.code ? `<small>${esc(product.code)}</small>` : "";
    return `
            <div class="o_list_row">
                ${thumbHtml(product, "fa-wrench")}
                <div class="o_list_name">${esc(line.name)}${code}</div>
                <div class="o_qty">
                    <button type="button" data-qty="-1" data-index="${index}" aria-label="Moins">
                        <i class="fa fa-minus"></i></button>
                    <span>${line.quantity}</span>
                    <button type="button" data-qty="1" data-index="${index}" aria-label="Plus">
                        <i class="fa fa-plus"></i></button>
                </div>
            </div>`;
}
