// A colleague's appointment as a planning card: his intervention when it is
// on the phone (he can take it over), else a read-only card.
export function colleagueJob(appointment, jobsById) {
    const slot = { start: appointment.start, stop: appointment.stop, allday: appointment.allday };
    const job = !appointment.private && jobsById.get(appointment.task_id);
    if (job) {
        return { ...job, appointment: slot };
    }
    return appointment.private ? busyJob(appointment, slot) : readonlyJob(appointment, slot);
}

// A private appointment: only that he is busy.
function busyJob(appointment, slot) {
    return {
        id: `c${appointment.id}`,
        readonly: true,
        name: "Occupé",
        color: 0,
        appointment: slot,
        place: {},
    };
}

function readonlyJob(appointment, slot) {
    return {
        id: `c${appointment.id}`,
        readonly: true,
        name: appointment.name,
        stage: appointment.stage,
        missionName: appointment.mission,
        color: appointment.color,
        appointment: slot,
        place: appointment.place || {},
    };
}
