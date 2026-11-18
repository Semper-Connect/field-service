import { linkify } from "../utils/html.js";
import { richHtml } from "../utils/rich_html.js";

// Formatted as in Odoo when it sent the HTML, else plain text with its links.
export function formattedHtml({ text, html }) {
    return html
        ? `<div class="o_rich">${richHtml(html)}</div>`
        : `<div class="o_plain">${linkify(text)}</div>`;
}
