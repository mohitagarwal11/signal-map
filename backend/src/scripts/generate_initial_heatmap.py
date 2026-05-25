import gzip
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SRC_DIR))

from controllers.towers_controller import get_heatmap_points  # noqa: E402


INITIAL_VIEWPORT_BOUNDS = {
    "min_lat": 8.066,
    "max_lat": 37.100,
    "min_lon": 68.116,
    "max_lon": 97.416,
}
INITIAL_VIEWPORT_ZOOM = 4
OUTPUT_PATH = SRC_DIR / "static" / "initial_heatmap.json"


def main():
    # The startup viewport is deterministic, so generating it once gives us a
    # static spatial snapshot now and mirrors how vector tiles will be emitted later.
    points = get_heatmap_points(
        INITIAL_VIEWPORT_BOUNDS["min_lat"],
        INITIAL_VIEWPORT_BOUNDS["max_lat"],
        INITIAL_VIEWPORT_BOUNDS["min_lon"],
        INITIAL_VIEWPORT_BOUNDS["max_lon"],
        INITIAL_VIEWPORT_ZOOM,
    )

    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "zoom": INITIAL_VIEWPORT_ZOOM,
        "bounds": INITIAL_VIEWPORT_BOUNDS,
        "points": points,
    }

    snapshot_json = json.dumps(snapshot, separators=(",", ":"))
    snapshot_bytes = snapshot_json.encode("utf-8")
    gzip_bytes = gzip.compress(snapshot_bytes)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_bytes(snapshot_bytes)
    print(
        "PERF initial_snapshot "
        f"point_count={len(points)} "
        f"raw_bytes={len(snapshot_bytes)} "
        f"gzip_bytes={len(gzip_bytes)}"
    )
    print(f"Wrote {len(points)} points to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
