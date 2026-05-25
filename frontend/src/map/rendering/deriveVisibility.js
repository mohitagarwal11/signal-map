export function deriveVisibility({ zoom, heatmapAvailable, towersAvailable }) {
  const numericZoom = typeof zoom === "number" ? zoom : 0;

  const rendererPolicy = {
    heatmap: {
      fadeOut: [11.5, 12.5],
    },
    towers: {
      fadeIn: [11.5, 12.5],
    },
  };

  function clamp01(v) {
    return v <= 0 ? 0 : v >= 1 ? 1 : v;
  }

  function smootherstep(t) {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function interpLinear(val, [a, b]) {
    if (b === a) return val >= b ? 1 : 0;
    return clamp01((val - a) / (b - a));
  }

  function computeWeightForPolicy(policyEntry, z) {
    let base = 1;
    if (policyEntry.fadeIn) {
      const [s, e] = policyEntry.fadeIn;
      if (z <= s) base = 0;
      else if (z >= e) base = 1;
      else base = smootherstep(interpLinear(z, [s, e]));
    }

    if (policyEntry.fadeOut) {
      const [s, e] = policyEntry.fadeOut;
      if (z >= e) {
        base = 0;
      } else if (z > s) {
        const t = smootherstep(interpLinear(z, [s, e]));
        base = base * (1 - t);
      } else {
        base = 1;
      }
    }

    return clamp01(base);
  }

  const heatmapSuppressed = !heatmapAvailable;
  const towersSuppressed = towersAvailable === false;

  const heatmapBase = heatmapSuppressed
    ? 0
    : computeWeightForPolicy(rendererPolicy.heatmap, numericZoom);
  const towersBase = towersSuppressed
    ? 0
    : computeWeightForPolicy(rendererPolicy.towers, numericZoom);

  const GAMMA = 0.85;
  const heatmapWarp = Math.pow(heatmapBase, GAMMA);
  const towersWarp = Math.pow(towersBase, GAMMA);

  const sum = heatmapWarp + towersWarp;
  let heatmapWeight = heatmapWarp;
  let towersWeight = towersWarp;
  const NORMALIZATION_CEILING = 1.15;
  const normalizationScale =
    sum > NORMALIZATION_CEILING ? NORMALIZATION_CEILING / sum : 1;
  if (normalizationScale < 1) {
    heatmapWeight = heatmapWarp * normalizationScale;
    towersWeight = towersWarp * normalizationScale;
  }

  const activeRenderers = [];
  if (heatmapWeight > 0.001) activeRenderers.push("heatmap");
  if (towersWeight > 0.001) activeRenderers.push("towers");

  const dominantRenderer =
    activeRenderers.length === 0
      ? null
      : activeRenderers.reduce((winner, renderer) => {
          const weights = {
            heatmap: heatmapWeight,
            towers: towersWeight,
          };

          return weights[renderer] > weights[winner] ? renderer : winner;
        }, activeRenderers[0]);

  const rendererDiagnostics = {
    zoom: numericZoom,
    baseWeights: {
      heatmap: heatmapBase,
      towers: towersBase,
    },
    warpedWeights: {
      heatmap: heatmapWarp,
      towers: towersWarp,
    },
    normalized: normalizationScale < 1,
    normalizationScale,
    sum,
    activeRenderers,
    dominantRenderer,
  };

  const heatmapVisible = heatmapWeight > 0;
  const towersVisible = towersWeight > 0;

  return {
    heatmapWeight,
    towersWeight,
    heatmapVisible,
    towersVisible,
    rendererPolicy,
    rendererDiagnostics,
  };
}
