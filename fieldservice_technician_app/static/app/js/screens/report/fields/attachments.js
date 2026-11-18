// "Photos et documents": images are shrunk and shown as photos; anything
// else is kept as a file.
import { toast } from "../../../core/ui.js";
import { compressImage, dataUrlBytes, readFile, sizeLabel } from "../../../utils/files.js";
import { esc } from "../../../utils/html.js";

const MAX_FILE_MB = 20;

export const attachmentsFieldHtml = () => `
            <div class="o_field">
                <span class="o_label">Photos et documents</span>
                <div class="o_photos" id="photos"></div>
                <div class="o_list o_files" id="files"></div>
                <label class="btn btn-secondary o_attach">
                    <i class="fa fa-camera"></i> Ajouter une photo ou un fichier
                    <input type="file" id="add-files" multiple/>
                </label>
            </div>`;

export function bindAttachments(draft, save) {
    const changed = () => {
        drawAttachments(draft, changed);
        save();
    };
    document.getElementById("add-files").onchange = (event) =>
        addFiles(event.target, draft, changed);
    drawAttachments(draft, changed);
}

// The photos and files of the draft, each with its remove button.
function drawAttachments(draft, changed) {
    const photos = document.getElementById("photos");
    const files = document.getElementById("files");
    photos.innerHTML = draft.photos.map(photoItemHtml).join("");
    files.innerHTML = draft.files.map(fileItemHtml).join("");
    bindRemove(photos, "[data-remove-photo]", (button) => {
        draft.photos.splice(Number(button.dataset.removePhoto), 1);
        changed();
    });
    bindRemove(files, "[data-remove-file]", (button) => {
        draft.files.splice(Number(button.dataset.removeFile), 1);
        changed();
    });
}

function bindRemove(container, selector, remove) {
    for (const button of container.querySelectorAll(selector)) {
        button.onclick = () => remove(button);
    }
}

const photoItemHtml = (photo, index) => `
        <div class="o_photo">
            <img src="${photo.data}" alt=""/>
            <button type="button" data-remove-photo="${index}" aria-label="Supprimer">
                <i class="fa fa-times"></i></button>
        </div>`;

function fileItemHtml(file, index) {
    const size = sizeLabel(dataUrlBytes(file.data));
    return `
        <div class="o_list_row">
            <span class="o_img_ph"><i class="fa ${fileIcon(file.name)}"></i></span>
            <div class="o_list_name">${esc(file.name)}<small>${size}</small></div>
            <button type="button" class="o_icon_btn" data-remove-file="${index}"
                    aria-label="Supprimer"><i class="fa fa-times"></i></button>
        </div>`;
}

async function addFiles(input, draft, changed) {
    for (const file of input.files) {
        await addFile(file, draft);
    }
    input.value = "";
    changed();
}

// A photo when the browser can draw it, else a file.
async function addFile(file, draft) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast(`${file.name} dépasse ${MAX_FILE_MB} Mo`, "warning");
        return;
    }
    try {
        draft.photos.push(await toPhoto(file));
    } catch {
        try {
            draft.files.push({ name: file.name, data: await readFile(file) });
        } catch {
            toast(`Fichier illisible : ${file.name}`, "warning");
        }
    }
}

// Rejects for non-images and formats the browser cannot draw (HEIC on Android).
async function toPhoto(file) {
    if (!file.type.startsWith("image/")) {
        throw new Error("not an image");
    }
    const name = `${file.name.replace(/\.\w+$/, "")}.jpg`;
    return { name, data: await compressImage(file) };
}

function fileIcon(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") {
        return "fa-file-pdf-o";
    }
    if (["doc", "docx", "odt"].includes(ext)) {
        return "fa-file-word-o";
    }
    if (["xls", "xlsx", "ods", "csv"].includes(ext)) {
        return "fa-file-excel-o";
    }
    if (["heic", "heif", "jpg", "jpeg", "png"].includes(ext)) {
        return "fa-file-image-o";
    }
    return "fa-file-o";
}
