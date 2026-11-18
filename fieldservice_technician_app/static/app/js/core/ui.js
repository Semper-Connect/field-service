import { dom } from "./env.js";

let toastTimer;
export function toast(message, type = "", ms = 3500) {
    dom.toast.textContent = message;
    dom.toast.className = `o_notification show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (dom.toast.className = "o_notification"), ms);
}

export function closeDialog() {
    dom.dialog.hidden = true;
    dom.dialog.innerHTML = "";
    dom.dialog.classList.remove("o_dialog_popup");
}
