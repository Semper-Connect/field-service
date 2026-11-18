// One day of the planning: what it shows, from the phone's data, and the
// days or colleague's planning still to load from Odoo.
import { state, store } from "../../core/env.js";
import { addDays, dayOf, todayKey } from "../../utils/dates.js";
import { colleagueJob } from "./colleague_jobs.js";
import { loadColleague, loadDay } from "./remote_days.js";

const DEFAULT_WINDOW = { days_before: 7, days_after: 7 }; // until the first sync

const byStart = (a, b) => (a.appointment.start < b.appointment.start ? -1 : 1);
const byDeadline = (a, b) => ((a.deadline || "~") < (b.deadline || "~") ? -1 : 1);

// allJobs: his and his colleagues' interventions; jobs: his own.
// onLoaded: redraws once something missing came from Odoo.
export async function dayView(allJobs, jobs, onLoaded) {
    const meta = await planningMeta();
    const colleague = shownColleague(meta.colleagues);
    const today = todayKey();
    const day = state.day;
    const inWindow = isInWindow(day, meta.planningWindow);
    const loads = startLoads(day, colleague, meta, inWindow, onLoaded);
    return {
        ...meta,
        ...dayItems(day, colleague, allJobs, jobs),
        ...loads,
        colleague,
        today,
        day,
        inWindow,
        partial: isPartial(day, today, inWindow, colleague, loads.loading),
    };
}

// What is missing on the phone, asked to Odoo: the colleague's whole planning
// once, a day outside the window once per planning refresh.
function startLoads(day, colleague, meta, inWindow, onLoaded) {
    const loading = colleague && loadColleague(colleague, meta.lastSync, onLoaded);
    const dayLoaded = meta.loadedDays.includes(`${colleague ? colleague.id : "me"}@${day}`);
    const missing = !inWindow && !dayLoaded && meta.lastSync;
    const dayLoad = missing && loadDay(day, colleague, meta.lastSync, onLoaded);
    return { loading, dayLoad, downloaded: inWindow || dayLoaded };
}

async function planningMeta() {
    const keys = ["colleagues", "window", "lastJobsSync", "loadedDays"];
    const [colleagues = [], planningWindow = DEFAULT_WINDOW, lastSync, loadedDays = []] =
        await Promise.all(keys.map((key) => store.getMeta(key)));
    return { colleagues, planningWindow, lastSync, loadedDays };
}

// The colleague whose planning is shown, none for his own.
function shownColleague(colleagues) {
    const colleague = colleagues.find((c) => String(c.id) === String(state.who));
    if (!colleague) {
        state.who = "me";
    }
    return colleague;
}

// The day's appointments, its tasks without appointment (on their deadline
// day), and the days with something, for the week strip.
function dayItems(day, colleague, allJobs, jobs) {
    const jobsById = new Map(allJobs.map((job) => [job.id, job]));
    const items = colleague ? colleague.appointments.map((a) => colleagueJob(a, jobsById)) : jobs;
    const planned = items.filter((job) => job.appointment);
    const unplanned = colleague
        ? (colleague.unplanned_ids || []).map((id) => jobsById.get(id)).filter(Boolean)
        : jobs.filter((job) => !job.appointment && job.deadline);
    return {
        ofDay: planned.filter((job) => dayOf(job.appointment.start) === day).sort(byStart),
        unplanned: unplanned.filter((job) => dayOf(job.deadline) === day).sort(byDeadline),
        busyDays: new Set([
            ...planned.map((job) => dayOf(job.appointment.start)),
            ...unplanned.map((job) => dayOf(job.deadline)),
        ]),
    };
}

function isInWindow(day, planningWindow) {
    const today = todayKey();
    return (
        day >= addDays(today, -planningWindow.days_before) &&
        day <= addDays(today, planningWindow.days_after)
    );
}

// Until his planning is opened online, only today and tomorrow are on the phone.
const isPartial = (day, today, inWindow, colleague, loading) =>
    inWindow &&
    colleague &&
    !colleague.loaded &&
    !loading &&
    (day < today || day > addDays(today, 1));
