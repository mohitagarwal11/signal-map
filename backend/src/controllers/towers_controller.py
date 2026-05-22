# this should actually contain all the functions for handling tower data
from db.db import engine
from sqlalchemy import text


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
                "limit": min(limit, 2000),
                "offset": offset,
            },
        )
        towers = [dict(row._mapping) for row in result]

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

    return count
