import math

EARTH_RADIUS_M = 6371000


def distance_m(lat1, lng1, lat2, lng2):
    """Haversine distance in meters."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def has_coordinates(partner):
    return bool(partner.partner_latitude or partner.partner_longitude)
