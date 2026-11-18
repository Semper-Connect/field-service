// Search among his interventions on the phone (the loupe of the planning).
import { emptyHtml } from "../../components/widgets.js";
import { dom, state } from "../../core/env.js";
import { debounce } from "../../utils/debounce.js";
import { searchText } from "../../utils/text.js";
import { bindCards, cardHtml } from "./cards.js";

function matches(job, query) {
    const m = job.mission;
    const p = job.place;
    const fields = [m.name, m.os_number, m.object, m.customer, p.street, p.city, p.zip, p.name];
    return searchText(job.name, ...fields).includes(query);
}

const SEARCH_HTML = `
        <div class="o_control_panel">
            <label class="o_searchview">
                <i class="fa fa-search"></i>
                <input id="search" type="search" placeholder="Adresse, code postal, OM…"/>
                <button class="o_link_btn" id="search-close">Fermer</button>
            </label>
        </div>
        <div class="o_day_list" id="search-results"></div>`;

// Only the results are redrawn while typing: a new input would reset the phone keyboard.
export function renderSearch(jobs, status, onClose) {
    dom.title.textContent = "Rechercher";
    dom.view.innerHTML = SEARCH_HTML;
    const input = document.getElementById("search");
    const results = document.getElementById("search-results");
    const draw = () => drawResults(results, jobs, status);
    input.value = state.search;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener(
        "input",
        debounce(() => {
            state.search = input.value;
            draw();
        }, 250)
    );
    document.getElementById("search-close").onclick = (event) => closeSearch(event, onClose);
    draw();
}

function closeSearch(event, onClose) {
    event.preventDefault();
    state.searching = false;
    state.search = "";
    onClose();
}

function drawResults(results, jobs, status) {
    const query = searchText(state.search.trim());
    const found = query ? foundJobs(jobs, query) : [];
    if (!query) {
        results.innerHTML = "";
    } else if (found.length) {
        const cards = found.map((job) => cardHtml(job, status[job.id], { withDay: true }));
        results.innerHTML = cards.join("");
    } else {
        results.innerHTML = emptyHtml("fa-search", "Aucun résultat");
    }
    bindCards(results);
}

// The matching jobs, by appointment date; those without one last.
function foundJobs(jobs, query) {
    const when = (job) => (job.appointment ? job.appointment.start : "~");
    return jobs.filter((job) => matches(job, query)).sort((a, b) => (when(a) < when(b) ? -1 : 1));
}
