import gzip
import json
from datetime import datetime, timezone
from pathlib import Path

from controllers.towers_controller import get_heatmap_points
from utils.validation_util import _validate_bounds

INITIAL_VIEWPORT_BOUNDS = {
    "min_lat": 8.066,
    "max_lat": 37.100,
    "min_lon": 68.116,
    "max_lon": 97.416,
}

INITIAL_VIEWPORT_ZOOM = 4

OUTPUT_PATH = Path("initial_heatmap.json")


def main():
    min_lat, max_lat, min_lon, max_lon = _validate_bounds(
        INITIAL_VIEWPORT_BOUNDS["min_lat"],
        INITIAL_VIEWPORT_BOUNDS["max_lat"],
        INITIAL_VIEWPORT_BOUNDS["min_lon"],
        INITIAL_VIEWPORT_BOUNDS["max_lon"],
    )

    points = get_heatmap_points(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        INITIAL_VIEWPORT_ZOOM,
    )

    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "zoom": INITIAL_VIEWPORT_ZOOM,
        "bounds": INITIAL_VIEWPORT_BOUNDS,
        "point_count": len(points),
        "points": points,
    }

    snapshot_bytes = json.dumps(
        snapshot,
        separators=(",", ":"),
    ).encode("utf-8")

    gzip_bytes = gzip.compress(snapshot_bytes)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_bytes(snapshot_bytes)

    print(
        "PERF initial_snapshot "
        f"zoom={INITIAL_VIEWPORT_ZOOM} "
        f"point_count={len(points)} "
        f"raw_bytes={len(snapshot_bytes)} "
        f"gzip_bytes={len(gzip_bytes)}"
    )

    print(f"Wrote snapshot to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
