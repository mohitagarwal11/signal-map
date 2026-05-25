export function getFetchMode(zoom) {
  if (zoom < 8) {
    return "heatmap";
  }

  if (zoom < 11) {
    return "density";
  }

  return "raw";
}
