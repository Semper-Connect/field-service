// The status icon of each planning card.
import { store } from "../../core/env.js";

export const STATUS_ICONS = {
    pending: ["warning", "fa-clock-o", "Rapport en attente d'envoi"],
    sending: ["warning", "fa-clock-o", "Rapport en attente d'envoi"],
    sent: ["success", "fa-check", "Rapport envoyé"],
    error: ["danger", "fa-exclamation", "Rapport refusé"],
    draft: ["brand", "fa-pencil", "Brouillon"],
    started: ["action", "fa-play", "Chronomètre en cours"],
};

// Status by task id: a draft first, then a running timer, then the status of
// his last report. A stage chosen on the phone and not sent yet replaces the
// job's stage.
export function cardStatuses(jobs, drafts, outbox) {
    const status = reportStatuses(outbox);
    const stages = waitingStages(outbox);
    for (const job of jobs) {
        if (store.timerOf(job, outbox).runningSince) {
            status[job.id] = "started";
        }
        job.stage = stages[job.id] || job.stage;
    }
    for (const draft of drafts) {
        status[draft.task_id] = "draft";
    }
    return status;
}

// Sorted by date: the latest report of each task wins.
function reportStatuses(outbox) {
    const status = {};
    for (const entry of outbox.filter((e) => e.kind === "report")) {
        status[entry.task_id] = entry.status;
    }
    return status;
}

// Stages chosen in reports not sent yet.
function waitingStages(outbox) {
    const stages = {};
    for (const entry of outbox) {
        if (store.WAITING.includes(entry.status) && entry.stage_name) {
            stages[entry.task_id] = entry.stage_name;
        }
    }
    return stages;
}
