{
    "name": "Field Service Equipment Meter",
    "summary": "Track generic meter readings on Field Service equipment",
    "version": "18.0.1.0.0",
    "category": "Field Service",
    "author": "Sébastien Couratin, Semper Connect",
    "website": "https://github.com/OCA/field-service",
    "license": "AGPL-3",
    "depends": ["fieldservice"],
    "data": [
        "security/ir.model.access.csv",
        "views/fsm_equipment_views.xml",
        "views/meter_reading_views.xml",
    ],
    "installable": True,
    "development_status": "Beta",
}
