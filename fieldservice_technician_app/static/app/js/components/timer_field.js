// Démarrer / Arrêter on the intervention sheet. Each press takes the phone's
// position (a check-in) and drives his timesheet line in Odoo; the stage is
// never changed here, only in the report. Saved on the phone first: works
// without network.
import { store } from "../core/env.js";
import { currentPosition, positionLabel } from "../core/geo.js";
import { requestBackgroundSync, syncNow } from "../core/sync.js";
import { toast } from "../core/ui.js";
import { durationLabel, hoursSince, time } from "../utils/dates.js";
import { esc } from "../utils/html.js";
import { confirmTimerSwitch } from "./timer_switch.js";

const TICK_MS = 30000;
let tickTimer = null;

// Running: the current run only, "En cours depuis 09:12 · 35 min". Stopped:
// the total since his last report, "Total : 1 h 10", else "Pas démarré".
function stateLabel(timer) {
    if (timer.runningSince) {
        const current = durationLabel(hoursSince(timer.runningSince));
        return `En cours depuis ${time(timer.runningSince)} · ${current}`;
    }
    return timer.timedHours ? `Total : ${durationLabel(timer.timedHours)}` : "Pas démarré";
}

export function timerFieldHtml(job, timer) {
    if (job.writable === false) {
        return "";
    }
    const running = Boolean(timer.runningSince);
    const button = running
        ? '<button class="btn btn-danger" id="timer"><i class="fa fa-stop"></i> Arrêter</button>'
        : '<button class="btn btn-action" id="timer"><i class="fa fa-play"></i> Démarrer</button>';
    return `
        <section class="o_timer_field ${running ? "o_running" : ""}">
            <div class="o_timer_state" id="timer-state">${esc(stateLabel(timer))}</div>
            ${button}
        </section>`;
}

export function bindTimerField(job, timer, onChanged) {
    const button = document.getElementById("timer");
    if (!button) {
        return;
    }
    button.onclick = () => pressTimer(job, timer, button, onChanged);
    // The running time moves on while the sheet stays open
    clearInterval(tickTimer);
    if (timer.runningSince) {
        tickTimer = setInterval(() => {
            const state = document.getElementById("timer-state");
            if (!state) {
                clearInterval(tickTimer);
                return;
            }
            state.textContent = stateLabel(timer);
        }, TICK_MS);
    }
}

async function pressTimer(job, timer, button, onChanged) {
    const action = timer.runningSince ? "stop" : "start";
    button.disabled = true; // a double tap must not press it twice
    const others = action === "start" ? await othersRunning(job) : [];
    if (others.length && !(await confirmTimerSwitch(others))) {
        button.disabled = false;
        return;
    }
    button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Localisation…';
    const position = await currentPosition(8000);
    await stopJobs(others, position);
    const entry = await store.queueTimer(job, action, position);
    requestBackgroundSync();
    toastPressed(action, others, entry, position);
    if (navigator.onLine) {
        syncNow({ refresh: false });
    }
    onChanged();
}

// One timer at a time: Démarrer asks, then stops the one running elsewhere.
async function othersRunning(job) {
    const running = await store.getRunningJobs();
    return running.filter((other) => other.id !== job.id);
}

async function stopJobs(jobs, position) {
    for (const job of jobs) {
        await store.queueTimer(job, "stop", position);
    }
}

// "« Fuite » arrêtée. Démarré à 09:12, position ±12 m"
function toastPressed(action, stopped, entry, position) {
    const done = action === "start" ? "Démarré" : "Arrêté";
    const others = stopped.map((other) => `« ${other.name} » arrêtée. `).join("");
    toast(
        `${others}${done} à ${time(entry.created_at)}, ${positionLabel(position)}`,
        position.latitude !== undefined ? "success" : "warning",
        5000
    );
}
