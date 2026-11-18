// Edits `lines` (the report's supplies) in place; onChange saves the draft
// at each tap, so leaving with the phone's back button loses nothing.
import { dom } from "../core/env.js";
import { closeDialog, toast } from "../core/ui.js";
import { debounce } from "../utils/debounce.js";
import { esc } from "../utils/html.js";
import { searchText } from "../utils/text.js";
import { emptyHtml, thumbHtml } from "./widgets.js";

const ALL_ICON = '<span class="o_img_ph"><i class="fa fa-th"></i></span>';

export function openSupplyPicker(catalog, lines, onChange) {
    if (!catalog || !catalog.products.length) {
        toast("Catalogue non disponible : synchronisez une fois avec du réseau.", "warning");
        return;
    }
    const picker = { catalog, lines, onChange, categoryId: null, query: "" };
    draw(picker);
}

function quantityOf(lines, productId) {
    const line = lines.find((l) => l.product_id === productId);
    return line ? line.quantity : 0;
}

function productHtml(product, quantity) {
    const unit = /^unit/i.test(product.uom) ? "" : product.uom;
    const subtitle = [product.code, unit, product.is_pack ? "Pack" : ""].filter(Boolean);
    const counter = quantity
        ? `<span class="o_qty_badge">${quantity}</span>`
        : '<i class="fa fa-plus-circle o_add_icon"></i>';
    return `
        <div class="o_list_row o_product ${quantity ? "selected" : ""}" data-pid="${product.id}">
            ${thumbHtml(product, "fa-wrench")}
            <div class="o_list_name">${esc(product.name)}<small>${esc(
        subtitle.join(" · ")
    )}</small></div>
            ${counter}
        </div>`;
}

function categoryHtml(category, activeId) {
    const id = category ? category.id : null;
    const icon = category ? thumbHtml(category, "fa-th-large") : ALL_ICON;
    const name = category ? esc(category.name) : "Tout";
    return `
        <button class="o_category ${id === activeId ? "active" : ""}" data-categ="${id || ""}"
                title="${name}">
            ${icon}<span class="o_category_name">${name}</span>
        </button>`;
}

const DIALOG_HTML = `
        <div class="o_dialog_header">
            <button class="o_navbar_back" id="dlg-close" aria-label="Fermer">
                <i class="fa fa-arrow-left"></i></button>
            <h3>Ajouter des fournitures</h3>
        </div>
        <div class="o_control_panel o_control_panel_flat">
            <label class="o_searchview">
                <i class="fa fa-search"></i>
                <input id="dlg-search" type="search" placeholder="Rechercher un article…"/>
            </label>
        </div>
        <div class="o_categories" id="dlg-categories"></div>
        <div class="o_dialog_body" id="dlg-body"></div>
        <div class="o_dialog_footer">
            <button class="btn btn-primary" id="dlg-ok"></button>
        </div>`;

// The search input is built once: redrawing it would reset the phone keyboard.
function draw(picker) {
    dom.dialog.innerHTML = DIALOG_HTML;
    dom.dialog.hidden = false;
    const close = () => {
        closeDialog();
        picker.onChange();
    };
    document.getElementById("dlg-close").onclick = close;
    document.getElementById("dlg-ok").onclick = close;
    const input = document.getElementById("dlg-search");
    input.value = picker.query;
    input.addEventListener(
        "input",
        debounce(() => {
            picker.query = input.value;
            drawContent(picker);
        }, 200)
    );
    drawContent(picker);
}

function shownProducts({ catalog, categoryId, query }) {
    const search = searchText(query.trim());
    return catalog.products.filter(
        (p) =>
            (!categoryId || p.categ_id === categoryId) &&
            (!search || searchText(p.name, p.code).includes(search))
    );
}

function drawContent(picker) {
    drawCategories(picker);
    drawProducts(picker);
    const total = picker.lines.reduce((sum, line) => sum + line.quantity, 0);
    document.getElementById("dlg-ok").innerHTML = `
        <i class="fa fa-check"></i> Valider${total ? ` (${total})` : ""}`;
}

function drawCategories(picker) {
    const categories = document.getElementById("dlg-categories");
    categories.innerHTML = [null, ...picker.catalog.categories]
        .map((c) => categoryHtml(c, picker.categoryId))
        .join("");
    for (const button of categories.querySelectorAll("[data-categ]")) {
        button.onclick = () => {
            picker.categoryId = button.dataset.categ ? Number(button.dataset.categ) : null;
            drawContent(picker);
        };
    }
}

function drawProducts(picker) {
    const body = document.getElementById("dlg-body");
    const shown = shownProducts(picker);
    body.innerHTML = shown.length
        ? shown.map((p) => productHtml(p, quantityOf(picker.lines, p.id))).join("")
        : emptyHtml("fa-search", "Aucun article");
    for (const row of body.querySelectorAll("[data-pid]")) {
        row.onclick = () => addOne(picker, Number(row.dataset.pid));
    }
}

function addOne(picker, productId) {
    const product = picker.catalog.products.find((p) => p.id === productId);
    const line = picker.lines.find((l) => l.product_id === productId);
    if (line) {
        line.quantity++;
    } else {
        picker.lines.push({ product_id: product.id, name: product.name, quantity: 1 });
    }
    const body = document.getElementById("dlg-body");
    const scroll = body.scrollTop;
    drawContent(picker);
    body.scrollTop = scroll;
    picker.onChange();
}
