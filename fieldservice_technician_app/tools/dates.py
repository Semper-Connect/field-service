from odoo import fields


def to_iso(value):
    """UTC datetime as the app reads it, e.g. 2026-09-29T14:03:12Z."""
    return value.isoformat() + "Z" if value else False


def parse_client_datetime(value):
    """Datetime sent by the phone, now when missing or unreadable."""
    if not value:
        return fields.Datetime.now()
    try:
        # UTC ISO string, e.g. 2026-09-29T14:03:12.123Z
        return fields.Datetime.to_datetime(value.replace("T", " ")[:19])
    except ValueError:
        return fields.Datetime.now()
