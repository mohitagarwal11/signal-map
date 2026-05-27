import { getAreaKm2 } from "./getAreaKm2.js";

const RADIO_WEIGHTS = { NR: 1.0, LTE: 0.8, UMTS: 0.4, GSM: 0.1 };

export function getScore(towers, minLat, maxLat, minLon, maxLon) {
	const area = getAreaKm2(minLat, maxLat, minLon, maxLon);
	const weightedCount = towers.reduce(
		(sum, tower) => sum + (RADIO_WEIGHTS[tower.radio] ?? 0.1),
		0,
	);
	const density = weightedCount / area;

	return Math.min(Math.round(density * 500), 100);
}
