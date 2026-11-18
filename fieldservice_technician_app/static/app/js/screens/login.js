import { dom, LOGIN_URL, state } from "../core/env.js";

export function renderLogin() {
    dom.title.textContent = "Interventions";
    dom.back.hidden = true;
    const icon = document.querySelector("link[rel=icon]").href;
    const message = state.online
        ? "Connectez-vous avec votre compte Odoo pour télécharger votre planning."
        : "Pas de réseau. La première connexion nécessite Internet.";
    dom.view.innerHTML = `
        <div class="o_login">
            <img src="${icon}" alt=""/>
            <h2>Interventions</h2>
            <p>${message}</p>
            <a class="btn btn-primary" href="${LOGIN_URL}"><i class="fa fa-sign-in"></i> Se connecter</a>
        </div>`;
}
