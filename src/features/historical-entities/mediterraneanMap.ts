import type { HistoricalMapFocus } from './types';
import type { MediterraneanFeatureId } from './mediterraneanFeatures';

/**
 * Language-neutral context map from the Atlantic coast of Spain to the Gulf,
 * generated once from Natural Earth (public domain). Equirectangular,
 * 10°W–50°E and 14°N–48°N on an 800 × 537 canvas.
 */
export const mediterraneanContextMap = new URL('./assets/maps/mediterranean-context-map.svg', import.meta.url).href;

/**
 * The same map carried on east to 127°E and from 12°S to 63°N, so a card can
 * slide out to Central and East Asia. It sits under the context map, which
 * covers its frame exactly; these are its edges as percentages of that frame.
 */
export const wideContextMap = new URL('./assets/maps/wide-context-map.svg', import.meta.url).href;
export const WIDE_MAP_PLACEMENT = { left: -3.3333, top: -44.1047, width: 231.6667, height: 220.5234 };

const WEST = -10;
const EAST = 50;
const SOUTH = 14;
const NORTH = 48;
const WIDTH = 800;
const PX_PER_DEGREE_LAT = 600 / 38;

export const MEDITERRANEAN_MAP_ASPECT = `${WIDTH} / ${Math.round((NORTH - SOUTH) * PX_PER_DEGREE_LAT)}`;

const round = (value: number) => Math.round(value * 10) / 10;
const xPercent = (lon: number) => ((lon - WEST) / (EAST - WEST)) * 100;
const yPercent = (lat: number) => ((NORTH - lat) / (NORTH - SOUTH)) * 100;

/** A place marker. Coordinates are latitude, longitude in degrees. */
export const medPoint = (lat: number, lon: number, zoom = 1): HistoricalMapFocus => ({
  mode: 'point',
  x: round(xPercent(lon)),
  y: round(yPercent(lat)),
  zoom,
});

type LatLon = [lat: number, lon: number];

/**
 * Shapes lit up on the map (a sea, a river, an island, a land or ruled lands),
 * with optional arrows and city pins. The title label sits at lat, lon.
 */
export const medFeature = (
  features: MediterraneanFeatureId | MediterraneanFeatureId[],
  lat: number,
  lon: number,
  zoom = 1,
  extras: {
    arrows?: { from: LatLon; to: LatLon }[];
    pins?: { at: LatLon; label: string; labelAr?: string }[];
    /** Slide out to a wider view: its north-west corner and its width in degrees. */
    view?: { north: number; west: number; widthDegrees: number };
  } = {},
): HistoricalMapFocus => ({
  mode: 'feature',
  features: Array.isArray(features) ? features : [features],
  x: round(xPercent(lon)),
  y: round(yPercent(lat)),
  zoom,
  ...(extras.arrows
    ? {
        arrows: extras.arrows.map(arrow => ({
          fromX: round(xPercent(arrow.from[1])),
          fromY: round(yPercent(arrow.from[0])),
          toX: round(xPercent(arrow.to[1])),
          toY: round(yPercent(arrow.to[0])),
        })),
      }
    : {}),
  ...(extras.pins
    ? { pins: extras.pins.map(pin => ({ x: round(xPercent(pin.at[1])), y: round(yPercent(pin.at[0])), label: pin.label, ...(pin.labelAr ? { labelAr: pin.labelAr } : {}) })) }
    : {}),
  ...(extras.view
    ? {
        view: {
          x: round(xPercent(extras.view.west)),
          y: round(yPercent(extras.view.north)),
          scale: (EAST - WEST) / extras.view.widthDegrees,
        },
      }
    : {}),
});

