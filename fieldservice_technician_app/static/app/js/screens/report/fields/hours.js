// "Ajustement du temps": time not caught by Démarrer/Arrêter (forgotten, or
// too much), added or removed in Odoo as its own timesheet line: the lines
// already recorded do not change. Quarter hours.
import { dom } from "../../../core/env.js";
import { toast } from "../../../core/ui.js";
import { durationLabel, floatTime, hoursSince, time } from "../../../utils/dates.js";

const QUICK_HOURS = [0.25, 0.5, 1, 1.5, 2, 3];
const HOURS_STEP = 0.25;

// The current run and the total, so he sees whether time is missing:
// "En cours : 20 min (depuis 09:12, arrêté à la validation) · Total : 1 h 10."
function timedHint(timer) {
    if (!timer || (!timer.runningSince && !timer.timedHours)) {
        return "Pas de temps chronométré. Indiquez ici le temps passé.";
    }
    const current = timer.runningSince ? hoursSince(timer.runningSince) : 0;
    const total = durationLabel(timer.timedHours + current);
    const timed = timer.runningSince
        ? `En cours : ${durationLabel(current)} (depuis ${time(timer.runningSince)}, ` +
          `arrêté à la validation) · Total : ${total}.`
        : `Total chronométré : ${total}.`;
    return `${timed} Corrigez ici le temps oublié ou en trop.`;
}

// All the time on the task at the last sync, from anyone.
function loggedHint(job) {
    const logged = (job && job.logged_hours) || 0;
    return logged ? `Déjà enregistré sur la tâche : ${durationLabel(logged)}.` : "";
}

// The lowest adjustment: the task cannot end below zero. Odoo's total, or
// the time timed on the phone and not counted by Odoo yet when it is more.
export function lowestHours({ job, timer }) {
    const logged = (job && job.logged_hours) || 0;
    const timed = (timer && timer.timedHours) || 0;
    const running = timer && timer.runningSince ? hoursSince(timer.runningSince) : 0;
    return -Math.floor((Math.max(logged, timed) + running) / HOURS_STEP) * HOURS_STEP;
}

// Said instead of a "-" button doing nothing.
function warnLowest(lowest) {
    const message = lowest
        ? `Impossible de retirer plus de ${durationLabel(-lowest)} : ` +
          "c'est le temps enregistré sur la tâche."
        : "Aucun temps enregistré sur la tâche (par quart d'heure) : rien à retirer.";
    toast(message, "warning");
}

export function hoursFieldHtml(hours, timer, job) {
    const quickHours = QUICK_HOURS.map(
        (value) => `<button type="button" data-set="${value}">${floatTime(value)}</button>`
    );
    return `
            <div class="o_field">
                <span class="o_label">Ajustement du temps</span>
                <div class="o_field_hint" id="logged">${loggedHint(job)}</div>
                <div class="o_field_hint" id="timed">${timedHint(timer)}</div>
                <div class="o_float_time">
                    <button type="button" data-step="${-HOURS_STEP}" aria-label="Moins 15 minutes">
                        <i class="fa fa-minus"></i></button>
                    <input class="o_input" id="hours" readonly value="${floatTime(hours)}"/>
                    <button type="button" data-step="${HOURS_STEP}" aria-label="Plus 15 minutes">
                        <i class="fa fa-plus"></i></button>
                </div>
                <div class="o_chips">${quickHours.join("")}</div>
            </div>`;
}

export function bindHours(draft, save, lowest) {
    const input = document.getElementById("hours");
    const set = (hours) => {
        const wanted = Math.round(hours / HOURS_STEP) * HOURS_STEP;
        if (wanted < lowest) {
            warnLowest(lowest);
        }
        draft.hours = Math.max(lowest, wanted);
        input.value = floatTime(draft.hours);
        save();
    };
    for (const button of dom.view.querySelectorAll("[data-step]")) {
        button.onclick = () => set(draft.hours + Number(button.dataset.step));
    }
    for (const button of dom.view.querySelectorAll("[data-set]")) {
        button.onclick = () => set(Number(button.dataset.set));
    }
}
