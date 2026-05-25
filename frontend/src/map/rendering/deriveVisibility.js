export function deriveVisibility({ zoom, densityAvailable, rawAvailable }) {
  const numericZoom = typeof zoom === "number" ? zoom : 0;

  // Active renderer policy with fade zones (zoom ranges are inclusive ranges
  // used to compute linear weights). These ranges are intentionally
  // conservative to preserve current visible behavior while enabling
  // crossfades and overlaps.
  const rendererPolicy = {
    heatmap: {
      // full influence until lower mid zoom; extend fade out so heatmap
      // softens into the density masses rather than disappearing abruptly.
      fadeOut: [5, 10],
    },
    density: {
      // emerge earlier but overlap for longer with the heatmap so density
      // inherits softness and forms collective masses. Fade in earlier,
      // hold influence longer, fade out later to hand off to raw towers.
      fadeIn: [5, 9],
      fadeOut: [12, 14],
    },
    raw: {
      // raw towers should appear after density has formed and begun to
      // resolve into structure.
      fadeIn: [13, 15],
    },
  };

  // Perceptual easing helpers
  function clamp01(v) {
    return v <= 0 ? 0 : v >= 1 ? 1 : v;
  }

  // Smootherstep produces a smooth ease curve with zero derivatives at ends.
  function smootherstep(t) {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function interpLinear(val, [a, b]) {
    if (b === a) return val >= b ? 1 : 0;
    return clamp01((val - a) / (b - a));
  }

  function computeWeightForPolicy(policyEntry, z) {
    // Base from fadeIn (if present), using smootherstep for perceptual feel.
    let base = 1;
    if (policyEntry.fadeIn) {
      const [s, e] = policyEntry.fadeIn;
      if (z <= s) base = 0;
      else if (z >= e) base = 1;
      else base = smootherstep(interpLinear(z, [s, e]));
    }

    // Apply fadeOut if present (reduce from 1->0 over range using smootherstep).
    if (policyEntry.fadeOut) {
      const [s, e] = policyEntry.fadeOut;
      if (z <= s) {
        // no change
      } else if (z >= e) {
        base = 0;
      } else {
        const t = smootherstep(interpLinear(z, [s, e]));
        base = base * (1 - t);
      }
    }

    return clamp01(base);
  }

  // If density data is not available, heatmap/density influence should be
  // suppressed. Raw can still show if raw data is present (handled upstream).
  const densitySuppressed = !densityAvailable;

  const rawSuppressed = rawAvailable === false;

  // Compute base weights
  const heatmapBase = densitySuppressed
    ? 0
    : computeWeightForPolicy(rendererPolicy.heatmap, numericZoom);
  const densityBase = densitySuppressed
    ? 0
    : computeWeightForPolicy(rendererPolicy.density, numericZoom);
  const rawBase = rawSuppressed
    ? 0
    : computeWeightForPolicy(rendererPolicy.raw, numericZoom);

  // Perceptual warp (gamma) to soften handoff; gamma < 1 slightly boosts
  // mid-range influence for better perceptual mixing.
  const GAMMA = 0.85;
  const heatmapWarp = Math.pow(heatmapBase, GAMMA);
  const densityWarp = Math.pow(densityBase, GAMMA);
  const rawWarp = Math.pow(rawBase, GAMMA);

  // Soft normalization: only scale when the overlap is materially above 1.
  // This preserves dominance and avoids the over-equalized feel from strict
  // normalization while still preventing runaway opacity stacking.
  const sum = heatmapWarp + densityWarp + rawWarp;
  let heatmapWeight = heatmapWarp;
  let densityWeight = densityWarp;
  let rawWeight = rawWarp;
  const NORMALIZATION_CEILING = 1.15;
  const normalizationScale =
    sum > NORMALIZATION_CEILING ? NORMALIZATION_CEILING / sum : 1;
  if (normalizationScale < 1) {
    heatmapWeight = heatmapWarp * normalizationScale;
    densityWeight = densityWarp * normalizationScale;
    rawWeight = rawWarp * normalizationScale;
  }

  const activeRenderers = [];
  if (heatmapWeight > 0.001) activeRenderers.push("heatmap");
  if (densityWeight > 0.001) activeRenderers.push("density");
  if (rawWeight > 0.001) activeRenderers.push("raw");

  const dominantRenderer =
    activeRenderers.length === 0
      ? null
      : activeRenderers.reduce((winner, renderer) => {
          const weights = {
            heatmap: heatmapWeight,
            density: densityWeight,
            raw: rawWeight,
          };

          return weights[renderer] > weights[winner] ? renderer : winner;
        }, activeRenderers[0]);

  const rendererDiagnostics = {
    zoom: numericZoom,
    baseWeights: {
      heatmap: heatmapBase,
      density: densityBase,
      raw: rawBase,
    },
    warpedWeights: {
      heatmap: heatmapWarp,
      density: densityWarp,
      raw: rawWarp,
    },
    normalized: normalizationScale < 1,
    normalizationScale,
    sum,
    activeRenderers,
    dominantRenderer,
  };

  // For compatibility, also provide boolean snapshot (derived from weights).
  const densityVisible = densityWeight > 0;
  const heatmapVisible = heatmapWeight > 0;
  const rawVisible = rawWeight > 0;

  return {
    densityWeight,
    heatmapWeight,
    rawWeight,
    densityVisible,
    heatmapVisible,
    rawVisible,
    rendererPolicy,
    rendererDiagnostics,
  };
}
