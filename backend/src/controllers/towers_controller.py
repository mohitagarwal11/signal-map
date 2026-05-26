import math
from utils.heatmap_util import get_heatmap_sample_pct, get_heatmap_point_limit
from utils.operator_util import _build_operator_filter_clause
from utils.radio_util import _build_radio_filter_clause
from utils.validation_util import _validate_bounds
from db.db import engine
from sqlalchemy import text


def get_towers(
    min_lat,
    max_lat,
    min_lon,
    max_lon,
    limit,
    offset,
    network="all",
    operator="all",
):
    min_lat, max_lat, min_lon, max_lon = _validate_bounds(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
    )

    radio_filter_clause, radio_params = _build_radio_filter_clause("ct", network)
    operator_filter_clause, operator_params = _build_operator_filter_clause(
        "op",
        operator,
    )

    query = text(f"""
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
        {radio_filter_clause}
        {operator_filter_clause}
        LIMIT :limit
        OFFSET :offset
    """)

    params = {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "limit": limit,
        "offset": offset,
        **radio_params,
        **operator_params,
    }

    with engine.connect() as conn:
        towers = [dict(row) for row in conn.execute(query, params).mappings()]

    print(f"Fetched {len(towers)} towers")

    return {
        "limit": limit,
        "offset": offset,
        "returned": len(towers),
        "data": towers,
    }


def get_tower_count(
    min_lat,
    max_lat,
    min_lon,
    max_lon,
    network="all",
    operator="all",
):
    min_lat, max_lat, min_lon, max_lon = _validate_bounds(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
    )

    radio_filter_clause, radio_params = _build_radio_filter_clause(
        "cell_towers",
        network,
    )
    operator_filter_clause, operator_params = _build_operator_filter_clause(
        "op",
        operator,
    )

    query = text(f"""
        SELECT COUNT(*) AS count
        FROM cell_towers
        JOIN operators op
            ON cell_towers.mcc = op.mcc
            AND cell_towers.mnc = op.mnc
        WHERE location && ST_MakeEnvelope(
            :min_lon,
            :min_lat,
            :max_lon,
            :max_lat,
            4326
        )::geometry
        {radio_filter_clause}
        {operator_filter_clause}
    """)

    params = {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        **radio_params,
        **operator_params,
    }

    with engine.connect() as conn:
        count = conn.execute(query, params).scalar()

    print(f"Fetched total towers in bounds: {count}")

    return {"count": count}


def get_heatmap_points(
    min_lat,
    max_lat,
    min_lon,
    max_lon,
    zoom,
    network="all",
    operator="all",
):
    min_lat, max_lat, min_lon, max_lon = _validate_bounds(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
    )

    sample_pct = get_heatmap_sample_pct(zoom)
    point_limit = get_heatmap_point_limit(zoom)

    radio_filter_clause, radio_params = _build_radio_filter_clause(
        "cell_towers",
        network,
    )
    operator_filter_clause, operator_params = _build_operator_filter_clause(
        "op",
        operator,
    )

    query = text(f"""
        SELECT
            latitude::float AS latitude,
            longitude::float AS longitude
        FROM cell_towers
        TABLESAMPLE SYSTEM(:sample_pct)
        JOIN operators op
            ON cell_towers.mcc = op.mcc
            AND cell_towers.mnc = op.mnc
        WHERE location IS NOT NULL
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
            AND location && ST_MakeEnvelope(
                :min_lon,
                :min_lat,
                :max_lon,
                :max_lat,
                4326
            )::geometry
            {radio_filter_clause}
        {operator_filter_clause}
        LIMIT :limit
    """)

    params = {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "sample_pct": sample_pct,
        "limit": point_limit,
        **radio_params,
        **operator_params,
    }

    with engine.connect() as conn:
        points = [dict(row) for row in conn.execute(query, params).mappings()]

    return points
