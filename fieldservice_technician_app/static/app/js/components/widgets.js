// Small HTML pieces shared by the screens.
import { esc } from "../utils/html.js";

const AVATAR_COLORS = [
    "#5794dd",
    "#dc8534",
    "#9f628f",
    "#41a9a2",
    "#ee2f8a",
    "#61c36e",
    "#9872e6",
    "#db8865",
];

export const emptyHtml = (icon, title, text = "") =>
    `<div class="o_nocontent"><i class="fa ${icon}"></i><b>${esc(title)}</b>${esc(text)}</div>`;

export function foldHtml(title, count, content) {
    if (!content) {
        return "";
    }
    const badge = count ? ` <span class="o_count">${count}</span>` : "";
    return `
        <details class="o_fold">
            <summary>${esc(title)}${badge}</summary>
            <div class="o_fold_body">${content}</div>
        </details>`;
}

export const thumbHtml = (record, icon) =>
    record && record.image
        ? `<img src="data:image/png;base64,${record.image}" alt=""/>`
        : `<span class="o_img_ph"><i class="fa ${icon}"></i></span>`;

// seed: an id, or the name itself (same author, same color)
export function avatarHtml(name, seed = name || "") {
    const initials = (name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
    const number =
        typeof seed === "number"
            ? seed
            : [...String(seed)].reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const color = AVATAR_COLORS[number % AVATAR_COLORS.length];
    return `<span class="o_avatar" style="background:${color}">${esc(initials)}</span>`;
}
