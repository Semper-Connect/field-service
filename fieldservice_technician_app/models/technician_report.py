from odoo import fields, models


class FSMTechnicianReport(models.Model):
    _name = "fsm.technician.report"
    _description = "Field Service Technician Report"
    _order = "create_date desc"

    order_id = fields.Many2one("fsm.order", required=True, ondelete="cascade")
    user_id = fields.Many2one("res.users", required=True, default=lambda self: self.env.user)
    notes = fields.Text()
    instructions = fields.Html()
    submitted_at = fields.Datetime(default=fields.Datetime.now)
