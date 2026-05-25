export function getFetchMode(zoom) {
  if (zoom < 5) {
    return "heatmap";
  }

  if (zoom < 11) {
    return "cluster";
  }

  return "raw";
}
