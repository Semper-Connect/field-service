from odoo import http
from odoo.http import request


class FieldServiceTechnicianApi(http.Controller):
    """Compatibility routes for the Yann-Maël PWA, backed by fsm.order."""

    @http.route("/technician/api/session", type="json", auth="public")
    def session_info(self):
        if not request.session.uid:
            return {"logged": False}
        return {"logged": True, "uid": request.session.uid, "name": request.env.user.name}

    @http.route("/technician/api/jobs", type="json", auth="user")
    def jobs(self):
        return request.env["fsm.technician.app"].get_jobs_data()

    @http.route("/technician/api/job", type="json", auth="user")
    def job(self, order_id=False, task_id=False):
        return request.env["fsm.technician.app"].get_job_data(order_id or task_id)

    @http.route("/technician/api/colleague", type="json", auth="user")
    def colleague(self, user_id):
        return request.env["fsm.technician.app"].get_colleague_data(user_id)

    @http.route("/technician/api/day", type="json", auth="user")
    def day(self, day, user_id=False):
        return request.env["fsm.technician.app"].get_day_data(day, user_id)

    @http.route("/technician/api/report", type="json", auth="user")
    def report(self, report=None, payload=None):
        return request.env["fsm.technician.app"].submit_report(payload or report or {})

    @http.route("/technician/api/checkpoint", type="json", auth="user")
    def checkpoint(self, checkpoint):
        return {"status": "ok", "checkpoint": checkpoint}

    @http.route("/technician/api/catalog", type="json", auth="user")
    def catalog(self, version=None):
        return {"version": version, "categories": [], "products": []}
