export function getFetchMode(zoom) {
  if (typeof zoom !== "number") return "heatmap";

  if (zoom < 12) {
    return "heatmap";
  }

  return "towers";
}
