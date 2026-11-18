// "Documents liés": the files of every task of the mission. Only their
// names are on the phone; photo thumbnails (~20 KB) and the files themselves
// come from Odoo when the section is opened, so they need the network.
import { toast } from "../core/ui.js";
import { shortDate } from "../utils/dates.js";
import { sizeLabel } from "../utils/files.js";
import { esc } from "../utils/html.js";
import { foldHtml } from "./widgets.js";

const ICONS = [
    [/pdf/, "fa-file-pdf-o o_doc_pdf"],
    [/^image\//, "fa-file-image-o o_doc_image"],
    [/word|opendocument\.text|rtf/, "fa-file-word-o o_doc_word"],
    [/sheet|excel|csv/, "fa-file-excel-o o_doc_sheet"],
    [/zip|compressed/, "fa-file-archive-o"],
    [/^video\//, "fa-file-video-o"],
    [/^text\//, "fa-file-text-o"],
];
// Formats the phone's browser can show: photos get a thumbnail
export const isPhoto = (file) => /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
const iconOf = (file) => {
    const found = ICONS.find(([re]) => re.test(file.mimetype));
    return found ? found[1] : "fa-file-o";
};
const fileUrl = (file) => `/web/content/${file.id}`;

export function photoHtml(file) {
    const src = `/web/image/${file.id}/256x256?unique=${esc(file.version)}`;
    return `
        <a class="o_doc_photo" href="${fileUrl(file)}" target="_blank" rel="noopener"
           title="${esc(file.name)}">
            <img src="${src}" loading="lazy" alt="${esc(file.name)}"
                 onerror="this.replaceWith(Object.assign(document.createElement('i'),
                     {className: 'fa fa-file-image-o'}))"/>
        </a>`;
}

function fileHtml(file) {
    return `
        <a class="o_doc_file" href="${fileUrl(file)}" target="_blank" rel="noopener">
            <i class="fa ${iconOf(file)}"></i>
            <span class="o_doc_main">
                <span class="o_doc_name">${esc(file.name)}</span>
                <span class="o_doc_meta">${esc(shortDate(file.date))} · ${sizeLabel(
        file.size
    )}</span>
            </span>
        </a>`;
}

function groupHtml(group) {
    const photos = group.files.filter(isPhoto);
    const others = group.files.filter((f) => !isPhoto(f));
    const tag = group.current
        ? '<span class="o_doc_here">Cette intervention</span>'
        : group.task_id
        ? ""
        : '<span class="o_doc_here">Mission</span>';
    return `
        <div class="o_doc_group">
            <div class="o_doc_title"><span>${esc(group.name)}</span>${tag}</div>
            ${
                photos.length
                    ? `<div class="o_doc_photos">${photos.map(photoHtml).join("")}</div>`
                    : ""
            }
            ${others.map(fileHtml).join("")}
        </div>`;
}

export function documentsFold(job) {
    const docs = job.documents || { groups: [], total: 0 };
    const shown = docs.groups.reduce((n, g) => n + g.files.length, 0);
    const more =
        docs.total > shown
            ? `<div class="o_doc_more">${docs.total - shown} documents plus anciens dans Odoo</div>`
            : "";
    const content = docs.groups.map(groupHtml).join("") + more;
    return foldHtml("Documents liés", docs.total, shown ? content : "");
}

// Chatter photos: the same square thumbnails, in a smaller grid.
export const photosHtml = (files) =>
    files.length ? `<div class="o_doc_photos">${files.map(photoHtml).join("")}</div>` : "";

// Offline, opening a file would show the browser's error page.
export function bindDocuments() {
    for (const link of document.querySelectorAll(".o_doc_photo, .o_doc_file, .o_message_file")) {
        link.onclick = (event) => {
            if (!navigator.onLine) {
                event.preventDefault();
                toast("Disponible avec connexion", "warning");
            }
        };
    }
}
