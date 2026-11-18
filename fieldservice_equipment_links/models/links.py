from odoo import api, models


class MaintenanceEquipment(models.Model):
    _inherit = "maintenance.equipment"

    def action_view_fsm_equipment(self):
        self.ensure_one()
        equipment = self.env["fsm.equipment"].search(
            [("maintenance_equipment_id", "=", self.id)], limit=1
        )
        if not equipment:
            return False
        return {
            "type": "ir.actions.act_window",
            "name": "Field Service Equipment",
            "res_model": "fsm.equipment",
            "view_mode": "form",
            "res_id": equipment.id,
            "target": "current",
        }

    def write(self, vals):
        result = super().write(vals)
        if "serial_no" in vals:
            for maintenance in self:
                fsm = self.env["fsm.equipment"].search(
                    [("maintenance_equipment_id", "=", maintenance.id)], limit=1
                )
                if fsm and maintenance.serial_no and not fsm.lot_id:
                    lot = self.env["stock.lot"].search(
                        [("name", "=", maintenance.serial_no)], limit=1
                    )
                    if lot:
                        fsm.with_context(skip_serial_sync=True).write({"lot_id": lot.id})
        return result


class FSMEquipment(models.Model):
    _inherit = "fsm.equipment"

    def _sync_maintenance_serial(self):
        Lot = self.env["stock.lot"]
        for equipment in self:
            maintenance = equipment.maintenance_equipment_id
            if not maintenance or not equipment.lot_id:
                continue
            serial = equipment.lot_id.name
            if maintenance.serial_no != serial:
                maintenance.with_context(skip_serial_sync=True).write(
                    {"serial_no": serial}
                )

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        if not self.env.context.get("skip_serial_sync"):
            records._sync_maintenance_serial()
        return records

    def write(self, vals):
        result = super().write(vals)
        if "lot_id" in vals and not self.env.context.get("skip_serial_sync"):
            self._sync_maintenance_serial()
        return result

    def action_view_maintenance_equipment(self):
        self.ensure_one()
        equipment = self.maintenance_equipment_id
        if not equipment:
            return False
        return {
            "type": "ir.actions.act_window",
            "name": "Maintenance Equipment",
            "res_model": "maintenance.equipment",
            "view_mode": "form",
            "res_id": equipment.id,
            "target": "current",
        }
