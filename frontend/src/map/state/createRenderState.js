import { EMPTY_GEOJSON } from "../constants/renderConstants";

export function createRenderState() {
  const state = {
    mapReady: false,
    layersInitialized: false,

    // Canonical fetch mode for dataset requests. Possible values: 'density',
    // 'raw'. This is intentionally independent from renderer state.
    fetchMode: "density",

    // `densityAvailable` indicates whether the canonical density dataset has
    // been populated for the current viewport.
    densityAvailable: false,

    // `rawAvailable` indicates whether raw/unaggregated tower points have been
    // populated for the current viewport. Used to gate the raw renderer.
    rawAvailable: false,

    densityGeoJSON: EMPTY_GEOJSON,
    rawGeoJSON: EMPTY_GEOJSON,
    // Renderer weights snapshot (derived each render pass). Values range
    // from 0.0 -> 1.0 and represent each renderer's influence over the
    // composed visualization. Binary visibility may be derived from
    // weights (weight > 0) for compatibility.
    rendererWeights: {
      density: 0,
      heatmap: 0,
      raw: 0,
    },
    // NOTE: `rendererVisibility` (boolean snapshot) was removed — prefer
    // numeric `rendererWeights` for composition decisions and diagnostics.
    // Renderer policy declarative structure (activation ranges, overlaps).
    // Populated by the active policy evaluator in `deriveVisibility`.
    rendererPolicy: {},
  };

  // Note: legacy `mode`, `heatmapAvailable`, and `heatmapGeoJSON` were removed
  // in this phase. The canonical properties are `fetchMode` and
  // `densityGeoJSON`/`rawGeoJSON`.

  return state;
}
