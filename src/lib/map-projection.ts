/**
 * Same Mercator projection as public/landing/world.svg (1000 × 668.1, lat 84°N … 58°S, no Antarctica).
 * Returns the point as percentages of the map box so pins can be absolutely positioned.
 */
const LAT_N = 84;
const LAT_S = -58;
const my = (lat: number) => Math.log(Math.tan(Math.PI / 4 + ((Math.max(Math.min(lat, LAT_N), LAT_S) * Math.PI) / 180) / 2));
const YN = my(LAT_N);
const YS = my(LAT_S);

export const MAP_ASPECT = (2 * Math.PI) / (YN - YS); // width / height

export function projectPct(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * 100, y: ((YN - my(lat)) / (YN - YS)) * 100 };
}
