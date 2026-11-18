// Swiping the planning's day left or right shows the next or previous day.
import { dom, state } from "../../core/env.js";
import { addDays } from "../../utils/dates.js";
import { goToDay } from "./planning.js";

const SWIPE_MIN_PX = 70;
let start = null; // [x, y] where the finger touched the day

export function installSwipe() {
    dom.view.addEventListener("touchstart", touchStart, { passive: true });
    dom.view.addEventListener("touchend", touchEnd, { passive: true });
}

function touchStart(event) {
    const onDay = state.route && state.route.name === "planning" && !state.searching;
    start = onDay ? [event.touches[0].clientX, event.touches[0].clientY] : null;
}

function touchEnd(event) {
    if (!start) {
        return;
    }
    const dx = event.changedTouches[0].clientX - start[0];
    const dy = event.changedTouches[0].clientY - start[1];
    start = null;
    // Mostly sideways: scrolling the day must not change it
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > 2 * Math.abs(dy)) {
        goToDay(addDays(state.day, dx < 0 ? 1 : -1));
    }
}
