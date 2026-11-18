from odoo import api, models


class FSMTechnicianApp(models.AbstractModel):
    _name = "fsm.technician.app"
    _description = "Field Service Technician Application"

    @api.model
    def _orders(self):
        Person = self.env["fsm.person"].sudo()
        person = Person.search([("partner_id", "=", self.env.user.partner_id.id)], limit=1)
        domain = [("person_id", "=", person.id)] if person else [("person_id", "=", False)]
        return self.env["fsm.order"].sudo().search(domain, order="scheduled_date_start,id")

    @api.model
    def _contacts(self, order):
        location = order.location_id
        partners = location.owner_id | location.contact_id | location.partner_id
        return [{"id": p.id, "name": p.name, "phone": p.phone or "", "email": p.email or ""} for p in partners if p]

    @api.model
    def _equipment(self, order):
        result = []
        for equipment in order.equipment_ids:
            latest = equipment.meter_reading_ids.sorted(lambda r: (r.reading_date, r.id), reverse=True)[:1]
            result.append({
                "id": equipment.id,
                "name": equipment.name,
                "serial": equipment.lot_id.name if "lot_id" in equipment._fields and equipment.lot_id else "",
                "product": equipment.product_id.display_name if "product_id" in equipment._fields and equipment.product_id else "",
                "meter": latest.value if latest else equipment.current_meter_value,
                "meter_unit": latest.unit if latest else equipment.current_meter_unit,
                "meter_date": latest.reading_date.isoformat() if latest else False,
            })
        return result

    @api.model
    def _order_values(self, order):
        appointment = self._calendar_appointment(order) if order.scheduled_date_start else False
        return {
            "id": order.id,
            "name": order.name,
            "stage_id": order.stage_id.id,
            "stage_name": order.stage_id.name,
            "stage": order.stage_id.name,
            "stages": [{"id": stage.id, "name": stage.name} for stage in order.stage_id],
            "description": order.description or "",
            "description_html": order.description or "",
            "instructions": order.todo or "",
            "resolution": order.resolution or "",
            "location": order.location_id.complete_name,
            "address": order.location_id.complete_direction or "",
            "place": {
                "name": order.location_id.complete_name,
                "street": order.location_id.street or "",
                "street2": order.location_id.street2 or "",
                "zip": order.location_id.zip or "",
                "city": order.location_id.city or "",
                "phone": order.location_id.phone or "",
            },
            "contacts": self._contacts(order),
            "notes": [],
            "appointment_description": False,
            "documents": {"groups": [], "total": 0},
            "history": [],
            "equipment": self._equipment(order),
            "scheduled_start": order.scheduled_date_start.isoformat() if order.scheduled_date_start else False,
            "scheduled_end": order.scheduled_date_end.isoformat() if order.scheduled_date_end else False,
            "appointment": appointment,
            "appointments": [appointment] if appointment else [],
            "deadline": False,
            "priority": order.priority == "3",
            "color": order.color or 0,
            "mission": {"id": order.team_id.id, "name": order.team_id.name, "description": ""},
            "missionName": order.team_id.name,
            "calendar_event_id": order.calendar_event_id.id if "calendar_event_id" in order._fields and order.calendar_event_id else False,
            "logged_hours": 0.0,
            "supplies": [],
            "notes": [],
            "appointment_description": False,
            "documents": {"groups": [], "total": 0},
            "history": [],
            "timer": False,
            "writable": True,
        }

    @api.model
    def get_jobs_data(self):
        return {"jobs": [self._order_values(order) for order in self._orders()], "colleagues": []}

    @api.model
    def get_job_data(self, order_id):
        order = self.env["fsm.order"].sudo().browse(int(order_id)).exists()
        return {"job": self._order_values(order) if order else False}

    @api.model
    def _calendar_appointment(self, order):
        return {
            "id": order.calendar_event_id.id if "calendar_event_id" in order._fields and order.calendar_event_id else order.id,
            "task_id": order.id,
            "name": order.name,
            "start": order.scheduled_date_start.isoformat() if order.scheduled_date_start else False,
            "stop": order.scheduled_date_end.isoformat() if order.scheduled_date_end else False,
            "place": {"street": order.location_id.complete_direction or ""},
            "stage": order.stage_id.name,
            "mission": order.team_id.name,
        }

    @api.model
    def get_colleague_data(self, user_id):
        user = self.env["res.users"].sudo().browse(int(user_id)).exists()
        if not user or user not in self.env.user.sudo().user_ids:
            return {"jobs": [], "appointments": [], "unplanned_ids": []}
        Person = self.env["fsm.person"].sudo()
        person = Person.search([("partner_id", "=", user.partner_id.id)], limit=1)
        orders = self.env["fsm.order"].sudo().search([("person_id", "=", person.id)]) if person else self.env["fsm.order"]
        planned = orders.filtered("scheduled_date_start")
        return {
            "jobs": [self._order_values(order) for order in orders],
            "appointments": [self._calendar_appointment(order) for order in planned],
            "unplanned_ids": orders.filtered(lambda order: not order.scheduled_date_start).ids,
        }

    @api.model
    def get_day_data(self, day, user_id=False):
        if user_id:
            return self.get_colleague_data(user_id)
        return self.get_jobs_data()

    @api.model
    def submit_report(self, payload):
        order = self.env["fsm.order"].browse(int(payload.get("order_id") or 0)).exists()
        if not order:
            return {"status": "error", "message": "Field Service order not found"}
        values = {}
        if payload.get("instructions") is not None:
            before = order.todo or ""
            after = payload["instructions"]
            order.sudo().write({"todo": after})
            order.sudo().message_post(body=f"Technician report: instructions updated.<br/>Before: {before}<br/>After: {after}")
        for reading in payload.get("meters", []):
            equipment = order.equipment_ids.filtered(lambda e, rid=reading.get("equipment_id"): e.id == int(rid or 0))[:1]
            if equipment and reading.get("value") is not None:
                self.env["fsm.equipment.meter.reading"].sudo().create({"equipment_id": equipment.id, "value": float(reading["value"]), "unit": reading.get("unit") or equipment.current_meter_unit or "hours", "source": "Field Service Technician App", "note": payload.get("notes") or ""})
        if payload.get("notes"):
            order.sudo().message_post(body=payload["notes"])
        return {"status": "ok", "order_id": order.id}
