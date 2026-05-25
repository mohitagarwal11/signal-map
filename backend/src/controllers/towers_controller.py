# this should actually contain all the functions for handling tower data
import logging
import math
import time

from db.db import engine
from sqlalchemy import text

HEATMAP_MAX_POINTS = 12_000
CLUSTER_LIMIT = 3000
DEFAULT_CLUSTER_ZOOM = 6.0

logger = logging.getLogger(__name__)


def _to_finite_float(value, field_name):
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")

    if not math.isfinite(number):
        raise ValueError(f"{field_name} must be finite")

    return number


def _validate_bounds(min_lat, max_lat, min_lon, max_lon):
    min_lat = _to_finite_float(min_lat, "min_lat")
    max_lat = _to_finite_float(max_lat, "max_lat")
    min_lon = _to_finite_float(min_lon, "min_lon")
    max_lon = _to_finite_float(max_lon, "max_lon")

    if min_lat >= max_lat:
        return None

    if min_lon >= max_lon:
        return None

    return min_lat, max_lat, min_lon, max_lon


def get_towers(min_lat, max_lat, min_lon, max_lon, limit, offset):
    query = text("""
        SELECT
            ct.radio,
            ct.mcc,
            ct.mnc,
            ct.latitude,
            ct.longitude,
            ct.range,
            ct.avg_signal,
            op.operator_name
        FROM cell_towers ct
        JOIN operators op
            ON ct.mcc = op.mcc
            AND ct.mnc = op.mnc
        WHERE ct.location && ST_MakeEnvelope(
            :min_lon,
            :min_lat,
            :max_lon,
            :max_lat,
            4326
        )::geometry
        LIMIT :limit
        OFFSET :offset
    """)

    with engine.connect() as conn:
        result = conn.execute(
            query,
            {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon,
                "limit": limit,
                "offset": offset,
            },
        )
        towers = [dict(row._mapping) for row in result]

    print(f"Fetched {len(towers)} towers")
    return {
        "limit": limit,
        "offset": offset,
        "returned": len(towers),
        "data": towers,
    }


def get_tower_count(min_lat, max_lat, min_lon, max_lon):
    query = text("""
        SELECT COUNT(*) AS count
        FROM cell_towers
        WHERE location && ST_MakeEnvelope(
            :min_lon,
            :min_lat,
            :max_lon,
            :max_lat,
            4326
        )::geometry
    """)

    with engine.connect() as conn:
        result = conn.execute(
            query,
            {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon,
            },
        )
        count = result.scalar()

    print(f"Fetched total towers in bounds: {count}")
    return {"count": count}


def get_heatmap_sample_pct(zoom):
    try:
        zoom = _to_finite_float(zoom, "zoom")
    except ValueError:
        zoom = DEFAULT_CLUSTER_ZOOM

    if zoom < 5:
        return 0.5

    if zoom < 6:
        return 1.0

    if zoom < 7:
        return 2.0

    if zoom < 8:
        return 5.0

    if zoom < 9:
        return 10.0

    if zoom < 10:
        return 16.0

    if zoom < 11:
        return 24.0

    if zoom < 12:
        return 32.0

    return 40.0


def get_heatmap_point_limit(zoom):
    try:
        zoom = _to_finite_float(zoom, "zoom")
    except ValueError:
        zoom = DEFAULT_CLUSTER_ZOOM

    if zoom < 6:
        return 3_500

    if zoom < 8:
        return 6_000

    if zoom < 10:
        return 9_000

    if zoom < 12:
        return 11_000

    return HEATMAP_MAX_POINTS


def get_heatmap_points(min_lat, max_lat, min_lon, max_lon, zoom):
    try:
        bounds = _validate_bounds(min_lat, max_lat, min_lon, max_lon)

        if bounds is None:
            logger.warning(
                "Invalid heatmap viewport bounds: "
                "min_lat=%r max_lat=%r min_lon=%r max_lon=%r",
                min_lat,
                max_lat,
                min_lon,
                max_lon,
            )
            return []

        min_lat, max_lat, min_lon, max_lon = bounds

        sample_pct = get_heatmap_sample_pct(zoom)
        point_limit = get_heatmap_point_limit(zoom)

        query = text("""
            WITH viewport AS (
                SELECT ST_MakeEnvelope(
                    :min_lon,
                    :min_lat,
                    :max_lon,
                    :max_lat,
                    4326
                )::geometry AS geom
            )
            SELECT
                latitude::float AS latitude,
                longitude::float AS longitude
            FROM cell_towers TABLESAMPLE SYSTEM(:sample_pct),
                 viewport
            WHERE location IS NOT NULL
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND location && viewport.geom
            LIMIT :limit
        """)

        query_start = time.perf_counter()

        with engine.connect() as conn:
            result = conn.execute(
                query,
                {
                    "min_lat": min_lat,
                    "max_lat": max_lat,
                    "min_lon": min_lon,
                    "max_lon": max_lon,
                    "sample_pct": sample_pct,
                    "limit": point_limit,
                },
            )

            points = [dict(row._mapping) for row in result]

        query_duration_ms = (time.perf_counter() - query_start) * 1000

        logger.info(
            "PERF heatmap_query duration_ms=%.2f point_count=%s zoom=%s sample_pct=%s point_limit=%s",
            query_duration_ms,
            len(points),
            zoom,
            sample_pct,
            point_limit,
        )

        return points

    except Exception:
        logger.exception(
            "Failed to fetch heatmap points for bounds "
            "min_lat=%r max_lat=%r min_lon=%r max_lon=%r zoom=%r",
            min_lat,
            max_lat,
            min_lon,
            max_lon,
            zoom,
        )

        return []

