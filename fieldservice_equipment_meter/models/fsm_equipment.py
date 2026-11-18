from odoo import api, fields, models


class FSMEquipment(models.Model):
    _inherit = "fsm.equipment"

    meter_reading_ids = fields.One2many(
        "fsm.equipment.meter.reading", "equipment_id", string="Meter Readings"
    )
    meter_reading_count = fields.Integer(compute="_compute_meter_reading_count")
    current_meter_value = fields.Float(string="Current Meter", copy=False)
    current_meter_unit = fields.Selection(
        [
            ("hours", "Hours"),
            ("km", "Kilometers"),
            ("cycles", "Cycles"),
            ("other", "Other"),
        ],
        string="Meter Unit",
        copy=False,
    )

    @api.depends("meter_reading_ids")
    def _compute_meter_reading_count(self):
        for equipment in self:
            equipment.meter_reading_count = len(equipment.meter_reading_ids)

    def action_view_meter_readings(self):
        self.ensure_one()
        action = self.env["ir.actions.act_window"]._for_xml_id(
            "fieldservice_equipment_meter.action_meter_reading"
        )
        action["domain"] = [("equipment_id", "=", self.id)]
        action["context"] = {"default_equipment_id": self.id}
        return action
