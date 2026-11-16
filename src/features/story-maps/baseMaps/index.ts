import { ANATOLIA_BASE, ANATOLIA_UNITS_PER_KM, projectAnatolia, unprojectAnatolia } from './anatolia';
import { NEAR_EAST_BASE, NEAR_EAST_UNITS_PER_KM, projectNearEast, unprojectNearEast } from './nearEast';
import { MEDITERRANEAN_BASE, MEDITERRANEAN_UNITS_PER_KM, projectMediterranean, unprojectMediterranean } from './mediterranean';
import { CENTRAL_ASIA_BASE, CENTRAL_ASIA_UNITS_PER_KM, projectCentralAsia, unprojectCentralAsia } from './centralAsia';
import type { StoryMapBaseMapId } from '../types';

export interface BaseMapDef {
  width: number;
  height: number;
  land: string;
  lakes: string;
  rivers: string;
  project: (lon: number, lat: number) => [number, number];
  unproject: (x: number, y: number) => [number, number];
  unitsPerKm: number;
  /** Mountain glyph positions on real ranges. Decoration only. */
  relief: Array<[number, number]>;
}

export const BASE_MAPS: Record<StoryMapBaseMapId, BaseMapDef> = {
  anatolia: {
    ...ANATOLIA_BASE,
    project: projectAnatolia,
    unproject: unprojectAnatolia,
    unitsPerKm: ANATOLIA_UNITS_PER_KM,
    // Taurus, Pontic, eastern highlands, Caucasus, Lebanon
    relief: [
      [30.9, 37.35], [32.6, 37.0], [34.2, 37.25], [35.6, 37.75], [37.4, 38.15],
      [36.8, 40.75], [38.9, 40.55], [40.6, 40.6], [42.4, 40.95],
      [42.6, 39.35], [44.0, 39.6],
      [44.2, 42.75], [46.3, 42.15],
      [36.6, 34.2],
    ],
  },
  nearEast: {
    ...NEAR_EAST_BASE,
    project: projectNearEast,
    unproject: unprojectNearEast,
    unitsPerKm: NEAR_EAST_UNITS_PER_KM,
    // Hejaz and Sarawat, Midian, Sinai, Lebanon, Taurus, Zagros, Ethiopian highlands
    relief: [
      [40.6, 21.6], [41.6, 19.4], [39.9, 24.6], [38.7, 26.6],
      [35.9, 28.2], [33.9, 28.7], [35.9, 34.1], [36.9, 37.4],
      [45.6, 34.6], [47.4, 32.9], [38.6, 13.2], [39.6, 11.6],
      [31.5, 37.6], [34.5, 37.1], [40.0, 39.8], [43.2, 38.0],
    ],
  },
  mediterranean: {
    ...MEDITERRANEAN_BASE,
    project: projectMediterranean,
    unproject: unprojectMediterranean,
    unitsPerKm: MEDITERRANEAN_UNITS_PER_KM,
    // Sierra Nevada, Atlas, Apennines, Sinai, Lebanon, Taurus, Zagros, Hejaz
    relief: [
      [-3.3, 37.05], [-6.5, 31.4], [-3.6, 32.9], [13.6, 42.3],
      [33.9, 28.7], [36.1, 34.1], [33.2, 37.1], [36.4, 37.8],
      [46.2, 33.9], [40.2, 23.6], [40.8, 20.4],
    ],
  },
  centralAsia: {
    ...CENTRAL_ASIA_BASE,
    project: projectCentralAsia,
    unproject: unprojectCentralAsia,
    unitsPerKm: CENTRAL_ASIA_UNITS_PER_KM,
    // Tian Shan, Pamir, Hindu Kush, Kunlun, Altai, Elburz, Zagros, Caucasus, Taurus
    relief: [
      [79.5, 42.2], [75.5, 41.6], [72.8, 38.6], [69.8, 35.6], [83.5, 36.2],
      [88.0, 48.6], [52.0, 36.3], [47.6, 33.6], [44.4, 42.8], [33.2, 37.2],
    ],
  },
};
