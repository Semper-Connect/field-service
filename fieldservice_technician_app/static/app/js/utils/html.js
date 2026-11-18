const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

// Web addresses and emails of a plain text, as links; line breaks are kept by CSS.
const LINK_RE = /\b(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;
const LINK_END_RE = /[.,;:!?)\]}]+$/; // "voir https://x.fr." : the dot is not in the link

function linkUrl(target) {
    if (target.includes("@") && !target.includes("/")) {
        return `mailto:${target}`;
    }
    return /^www\./i.test(target) ? `https://${target}` : target;
}

export const linkHtml = (url, label) =>
    `<a class="o_link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;

export function linkify(text) {
    let html = "";
    let last = 0;
    const value = String(text ?? "");
    for (const match of value.matchAll(LINK_RE)) {
        const target = match[0].replace(LINK_END_RE, "");
        html += esc(value.slice(last, match.index)) + linkHtml(linkUrl(target), esc(target));
        last = match.index + target.length;
    }
    return html + esc(value.slice(last));
}
