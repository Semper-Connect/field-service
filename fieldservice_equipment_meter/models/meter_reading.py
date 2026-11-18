from odoo import api, fields, models
from odoo.exceptions import ValidationError


class FSMEquipmentMeterReading(models.Model):
    _name = "fsm.equipment.meter.reading"
    _description = "Field Service Equipment Meter Reading"
    _order = "reading_date desc, id desc"

    equipment_id = fields.Many2one(
        "fsm.equipment", required=True, ondelete="cascade", index=True
    )
    reading_date = fields.Date(
        required=True, default=fields.Date.context_today, index=True
    )
    value = fields.Float(required=True)
    unit = fields.Selection(
        [
            ("hours", "Hours"),
            ("km", "Kilometers"),
            ("cycles", "Cycles"),
            ("other", "Other"),
        ],
        required=True,
    )
    source = fields.Char()
    note = fields.Text()

    @api.model_create_multi
    def create(self, vals_list):
        readings = super().create(vals_list)
        for reading in readings:
            reading._update_current_meter()
        return readings

    def write(self, vals):
        result = super().write(vals)
        if set(vals) & {"equipment_id", "reading_date", "value", "unit"}:
            self._update_current_meter()
        return result

    def _update_current_meter(self):
        for reading in self:
            latest = self.search(
                [
                    ("equipment_id", "=", reading.equipment_id.id),
                    ("unit", "=", reading.unit),
                ],
                order="reading_date desc, id desc",
                limit=1,
            )
            if latest:
                reading.equipment_id.write(
                    {
                        "current_meter_value": latest.value,
                        "current_meter_unit": latest.unit,
                    }
                )

    @api.constrains("equipment_id", "reading_date", "value", "unit")
    def _check_non_decreasing(self):
        for reading in self:
            previous = self.search(
                [
                    ("equipment_id", "=", reading.equipment_id.id),
                    ("unit", "=", reading.unit),
                    ("id", "!=", reading.id),
                    ("reading_date", "<=", reading.reading_date),
                ],
                order="reading_date desc, id desc",
                limit=1,
            )
            if previous and reading.value < previous.value:
                raise ValidationError(
                    "A meter reading cannot be lower than the previous reading."
                )
