from utils.validation_util import _to_finite_float

HEATMAP_MAX_POINTS = 12_000
HEATMAP_MAX_PCT = 50

HEATMAP_SAMPLE_STEPS = (
    (5, 3.0),
    (6, 5.0),
    (7, 8.0),
    (8, 12.0),
    (9, 18.0),
    (10, 25.0),
    (11, 35.0),
    (12, 50.0),
)

HEATMAP_POINT_LIMIT_STEPS = (
    (6, 3_000),
    (8, 5_000),
    (10, 8_000),
    (11, 11_000),
    (12, 14_000),
    (13, 18_000),
)


def _get_threshold_value(value, steps, default):
    for threshold, result in steps:
        if value < threshold:
            return result

    return default


def get_heatmap_sample_pct(zoom):
    zoom = _to_finite_float(zoom, "zoom")

    return _get_threshold_value(
        zoom,
        HEATMAP_SAMPLE_STEPS,
        HEATMAP_MAX_PCT,
    )


def get_heatmap_point_limit(zoom):
    zoom = _to_finite_float(zoom, "zoom")

    return _get_threshold_value(
        zoom,
        HEATMAP_POINT_LIMIT_STEPS,
        HEATMAP_MAX_POINTS,
    )
