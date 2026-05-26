import math


def _to_finite_float(value, field_name):
    try:
        number = float(value)
        if not math.isfinite(number):
            raise ValueError
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a finite number")

    return number


def _validate_bounds(min_lat, max_lat, min_lon, max_lon):
    min_lat = _to_finite_float(min_lat, "min_lat")
    max_lat = _to_finite_float(max_lat, "max_lat")
    min_lon = _to_finite_float(min_lon, "min_lon")
    max_lon = _to_finite_float(max_lon, "max_lon")

    if min_lat >= max_lat:
        raise ValueError("min_lat must be less than max_lat")

    if min_lon >= max_lon:
        raise ValueError("min_lon must be less than max_lon")

    return min_lat, max_lat, min_lon, max_lon
