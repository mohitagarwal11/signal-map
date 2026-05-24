export function getFetchMode(zoom) {
  if (zoom < 7) {
    return "count";
  }

  if (zoom < 11) {
    return "cluster";
  }

  return "raw";
}
