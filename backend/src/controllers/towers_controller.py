# this should actually contain all the functions for handling tower data
import logging
import math
import time

from db.db import engine
from sqlalchemy import text

HEATMAP_LIMIT = 8000
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


def get_grid_size(zoom):
    try:
        zoom = _to_finite_float(zoom, "zoom")
    except ValueError:
        logger.warning(
            "Invalid cluster zoom %r; falling back to zoom %s",
            zoom,
            DEFAULT_CLUSTER_ZOOM,
        )
        zoom = DEFAULT_CLUSTER_ZOOM

    if zoom < 5:
        return 3.0

    if zoom < 7:
        return 1.0

    if zoom < 9:
        return 0.25

    if zoom < 11:
        return 0.05

    return 0.01


def _get_safe_grid_size(zoom):
    grid_size = get_grid_size(zoom)

    if not math.isfinite(grid_size) or grid_size <= 0:
        logger.warning("Invalid cluster grid size %r; returning no clusters", grid_size)
        return None

    return grid_size


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
                "limit": min(limit, 5000),
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


def get_tower_clusters(min_lat, max_lat, min_lon, max_lon, zoom):
    try:
        bounds = _validate_bounds(min_lat, max_lat, min_lon, max_lon)

        if bounds is None:
            logger.warning(
                "Invalid cluster viewport bounds: "
                "min_lat=%r max_lat=%r min_lon=%r max_lon=%r",
                min_lat,
                max_lat,
                min_lon,
                max_lon,
            )
            return []

        min_lat, max_lat, min_lon, max_lon = bounds
        grid_size = _get_safe_grid_size(zoom)

        if grid_size is None:
            return []

        # Snap SRID 4326 geometries into zoom-sized degree cells. The explicit
        # x/y grid form keeps both axes on the same origin and works with
        # geometry values in EPSG:4326; casting is defensive for geography/EWKT
        # backed columns while preserving current geometry behavior.
        query = text("""
            WITH viewport AS (
                SELECT ST_MakeEnvelope(
                    :min_lon,
                    :min_lat,
                    :max_lon,
                    :max_lat,
                    4326
                )::geometry AS geom
            ),
            filtered_towers AS (
                SELECT
                    latitude::double precision AS latitude,
                    longitude::double precision AS longitude,
                    ST_SnapToGrid(
                        location::geometry,
                        0.0,
                        0.0,
                        :grid_size,
                        :grid_size
                    ) AS snapped_location
                FROM cell_towers, viewport
                WHERE location IS NOT NULL
                    AND latitude IS NOT NULL
                    AND longitude IS NOT NULL
                    AND latitude::text ~ '^-?[0-9]+(\\.[0-9]+)?$'
                    AND longitude::text ~ '^-?[0-9]+(\\.[0-9]+)?$'
                    AND location::geometry && viewport.geom
                    AND ST_IsValid(location::geometry)
            )
            SELECT
                AVG(latitude)::float AS latitude,
                AVG(longitude)::float AS longitude,
                COUNT(*)::int AS tower_count
            FROM filtered_towers
            GROUP BY snapped_location
            ORDER BY tower_count DESC
            LIMIT :cluster_limit
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
                    "grid_size": grid_size,
                    "cluster_limit": CLUSTER_LIMIT,
                },
            )
            clusters = [dict(row._mapping) for row in result]
        query_duration_ms = (time.perf_counter() - query_start) * 1000

        logger.info(
            "PERF cluster_query duration_ms=%.2f cluster_count=%s zoom=%s "
            "grid_size=%s bounds=(%s,%s,%s,%s)",
            query_duration_ms,
            len(clusters),
            zoom,
            grid_size,
            min_lat,
            max_lat,
            min_lon,
            max_lon,
        )
        return clusters
    except Exception:
        logger.exception(
            "Failed to fetch tower clusters for bounds "
            "min_lat=%r max_lat=%r min_lon=%r max_lon=%r zoom=%r",
            min_lat,
            max_lat,
            min_lon,
            max_lon,
            zoom,
        )
        return []


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
        return 15.0

    return 40.0


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
                    "limit": HEATMAP_LIMIT,
                },
            )

            points = [dict(row._mapping) for row in result]

        query_duration_ms = (time.perf_counter() - query_start) * 1000

        logger.info(
            "PERF heatmap_query duration_ms=%.2f point_count=%s zoom=%s sample_pct=%s",
            query_duration_ms,
            len(points),
            zoom,
            sample_pct,
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

