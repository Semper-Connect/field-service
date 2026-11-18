from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    fsm_equipment_count = fields.Integer(compute="_compute_fsm_equipment_count")

    def _compute_fsm_equipment_count(self):
        Equipment = self.env["fsm.equipment"]
        for product in self:
            product.fsm_equipment_count = Equipment.search_count(
                [("product_id.product_tmpl_id", "=", product.id)]
            )

    def action_view_fsm_equipment(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Field Service Equipment",
            "res_model": "fsm.equipment",
            "view_mode": "list,form",
            "domain": [("product_id.product_tmpl_id", "=", self.id)],
            "context": {"default_product_id": self.product_variant_id.id},
        }
