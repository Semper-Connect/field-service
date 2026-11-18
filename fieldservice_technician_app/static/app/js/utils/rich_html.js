// Formatted text from Odoo (chatter, descriptions): only these tags and links
// are kept, everything else is unwrapped or dropped. Odoo cleaned it already.
import { esc, linkHtml, linkify } from "./html.js";

const RICH_TAGS = new Set(
    "p br div span b strong i em u s strike del small sub sup ul ol li blockquote pre code hr h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th font".split(
        " "
    )
);
const RICH_DROPPED = new Set(
    "script style iframe object embed form input button select textarea img video audio svg math link meta template noscript".split(
        " "
    )
);
const SAFE_URL_RE = /^(https?:|mailto:|tel:|\/(?!\/))/i;

function cleanNode(node, doc) {
    const out = doc.createDocumentFragment();
    for (const child of [...node.childNodes]) {
        out.append(...cleanChild(child, doc));
    }
    return out;
}

// What one child becomes: nothing, itself cleaned, or its content only.
function cleanChild(child, doc) {
    if (child.nodeType === Node.TEXT_NODE) {
        // Bare addresses in the text become links too
        return htmlNodes(linkify(child.textContent), doc);
    }
    if (child.nodeType !== Node.ELEMENT_NODE) {
        return [];
    }
    const tag = child.tagName.toLowerCase();
    if (RICH_DROPPED.has(tag)) {
        return [];
    }
    return tag === "a" ? cleanLink(child, doc) : [cleanElement(child, tag, doc)];
}

// Nodes of an HTML made by esc(), linkify() or linkHtml().
function htmlNodes(html, doc) {
    const span = doc.createElement("span");
    span.innerHTML = html;
    return [...span.childNodes];
}

// A link to a safe address is rebuilt, any other one keeps its text only.
function cleanLink(link, doc) {
    const href = (link.getAttribute("href") || "").trim();
    const label = link.textContent;
    if (!SAFE_URL_RE.test(href)) {
        return [doc.createTextNode(label)];
    }
    return htmlNodes(linkHtml(href, esc(label || href)), doc);
}

// Kept tags are rebuilt without their attributes; the others give their content.
function cleanElement(element, tag, doc) {
    const children = cleanNode(element, doc);
    if (!RICH_TAGS.has(tag)) {
        return children;
    }
    const clean = doc.createElement(tag === "font" ? "span" : tag);
    clean.append(children);
    return clean;
}

export function richHtml(html) {
    const source = new DOMParser().parseFromString(String(html ?? ""), "text/html");
    const container = document.createElement("div");
    container.append(cleanNode(source.body, document));
    return container.innerHTML;
}
