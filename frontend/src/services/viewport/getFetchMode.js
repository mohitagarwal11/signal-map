export function getFetchMode(zoom) {
  // Simplified fetch model: only `density` (aggregated) and `raw` (points).
  // Low and mid zooms fetch the density dataset; high zoom fetches raw towers.
  if (typeof zoom !== "number") return "density";

  if (zoom < 11) {
    return "density";
  }

  return "raw";
}
