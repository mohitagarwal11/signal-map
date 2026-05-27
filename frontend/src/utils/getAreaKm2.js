export function getAreaKm2(minLat, maxLat, minLon, maxLon) {
  const latDiff = maxLat - minLat;
  const lonDiff = maxLon - minLon;
  const avgLat = (minLat + maxLat) / 2;
  const kmPerDeg = 111;

  return (
    latDiff * kmPerDeg *
    (lonDiff * kmPerDeg * Math.cos((avgLat * Math.PI) / 180))
  );
}