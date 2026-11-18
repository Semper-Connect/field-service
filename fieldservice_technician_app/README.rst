Field Service Technician App
============================

This is the first OCA extraction of the Semper Connect technician application.
The mobile static client is kept visually/functionally compatible with the
original first jet while its data source is Field Service ``fsm.order``.

The extraction deliberately does not depend on ZS, buildings, apartments,
``project_intervention``, ``partner_property`` or ``partner_relation``.

The first jet maps the technician job payload to Field Service orders,
Field Service locations, contacts, equipment, maintenance links, calendar
meetings, instructions, and generic equipment meter readings.
