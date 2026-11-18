// "Étape de la tâche": the stage the report puts the task in.
import { dom } from "../../../core/env.js";
import { esc } from "../../../utils/html.js";

// Allowed by his Odoo rights on this task (computed by Odoo, see _settable_stages).
const isSettable = (stage) => stage.settable !== false;

// The stages he may set, and the current one (keep it as it is).
export function reportStages(job, currentStageId) {
    return (job ? job.stages || [] : []).filter(
        (stage) => isSettable(stage) || stage.id === currentStageId
    );
}

// The draft's stage while still allowed, else the done stage, else the current one.
export function initialStageId(stages, job, draftStageId, currentStageId) {
    if (!stages.length || stages.some((stage) => stage.id === draftStageId)) {
        return draftStageId;
    }
    const done = stages.find((stage) => stage.id === job.done_stage_id);
    return done ? done.id : currentStageId;
}

export function stageChoiceHtml(stages, selectedId, currentId) {
    if (!stages.length) {
        return "";
    }
    const choices = stages.map((stage) => {
        const checked = stage.id === selectedId ? "checked" : "";
        const current = stage.id === currentId ? "<small>actuelle</small>" : "";
        return `
            <input type="radio" name="stage" id="stage-${stage.id}" value="${stage.id}" ${checked}/>
            <label for="stage-${stage.id}">${esc(stage.name)}${current}</label>`;
    });
    return `
        <div class="o_field">
            <span class="o_label">Étape de la tâche</span>
            <div class="o_stages">${choices.join("")}</div>
        </div>`;
}

export function checkedStageId() {
    const stage = dom.view.querySelector("input[name=stage]:checked");
    return stage ? Number(stage.value) : null;
}

export function bindStageChoice(save) {
    for (const radio of dom.view.querySelectorAll("input[name=stage]")) {
        radio.addEventListener("change", save);
    }
}
