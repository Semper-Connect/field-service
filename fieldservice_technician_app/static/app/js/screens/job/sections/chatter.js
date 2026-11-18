// "Chatter" section: messages of the task and of its mission, newest first.
import { isPhoto, photosHtml } from "../../../components/documents.js";
import { formattedHtml } from "../../../components/formatted_text.js";
import { avatarHtml, foldHtml } from "../../../components/widgets.js";
import { dateTime } from "../../../utils/dates.js";
import { esc } from "../../../utils/html.js";

export function chatterFold(job) {
    return foldHtml("Chatter", job.history.length, job.history.map(messageHtml).join(""));
}

function messageHtml(message) {
    const files = message.files || [];
    const text = message.text ? `<div class="o_message_text">${formattedHtml(message)}</div>` : "";
    const changes = changesHtml(message.changes || []);
    const photos = photosHtml(files.filter(isPhoto));
    return `
        <div class="o_message">
            ${avatarHtml(message.author)}
            <div class="o_message_body">
                ${messageHeadHtml(message)}
                ${text}${changes}${photos}${filesHtml(files)}
            </div>
        </div>`;
}

// Author, date, and the "Mission" and "Note" tags.
function messageHeadHtml(message) {
    const tags = [message.mission && "Mission", message.note && "Note"].filter(Boolean);
    const note = tags.map((tag) => `<span class="o_message_note">${tag}</span>`).join("");
    return `
        <div class="o_message_head">
            <b>${esc(message.author)}</b>
            <span class="text-muted">· ${esc(dateTime(message.date))}</span>
            ${note}
        </div>`;
}

// Tracked fields: old value → new value (field).
function changesHtml(changes) {
    return changes
        .map(
            (change) => `
            <div class="o_message_change">
                ${esc(change.old)} <i class="fa fa-long-arrow-right"></i> <b>${esc(change.new)}</b>
                <span class="text-muted">(${esc(change.field)})</span>
            </div>`
        )
        .join("");
}

// Files that are not photos, as download links.
function filesHtml(files) {
    return files
        .filter((file) => !isPhoto(file))
        .map(
            (file) => `
            <a class="o_message_file" href="/web/content/${file.id}?download=true"
               target="_blank" rel="noopener"><i class="fa fa-paperclip"></i> ${esc(file.name)}</a>`
        )
        .join("");
}
