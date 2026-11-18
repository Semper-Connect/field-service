from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"



class FSMTechnicianAppVisibility(models.AbstractModel):
    _inherit = "fsm.technician.app"

    def _visible_users(self):
        user = self.env.user
        return user.sudo().user_ids - user

    def _visible_orders_for_user(self, user):
        Person = self.env["fsm.person"].sudo()
        person = Person.search([("partner_id", "=", user.partner_id.id)], limit=1)
        return self.env["fsm.order"].sudo().search([("person_id", "=", person.id)]) if person else self.env["fsm.order"]

    def get_jobs_data(self):
        result = super().get_jobs_data()
        result["colleagues"] = [
            {
                "id": colleague.id,
                "name": colleague.name,
                "phone": colleague.partner_id.mobile or colleague.partner_id.phone or "",
                "appointments": [],
                "unplanned_ids": [],
                "loaded": False,
                "jobs": [self._order_values(order) for order in self._visible_orders_for_user(colleague)],
            }
            for colleague in self._visible_users()
        ]
        return result
