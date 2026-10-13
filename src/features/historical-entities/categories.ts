import type { HistoricalEntity, HistoricalEntityKind } from './types';

/** The five groups used for the colour code on cards, filters and maps. */
export type EntityGroup = 'cities' | 'lands' | 'water' | 'buildings' | 'people';

export const GROUP_OF_KIND: Record<HistoricalEntityKind, EntityGroup> = {
  city: 'cities',
  region: 'lands',
  country: 'lands',
  kingdom: 'lands',
  empire: 'lands',
  sea: 'water',
  river: 'water',
  island: 'water',
  spring: 'water',
  landmark: 'buildings',
  people: 'people',
  tribe: 'people',
  dynasty: 'people',
  person: 'people',
};

export const GROUP_ORDER: EntityGroup[] = ['cities', 'lands', 'water', 'buildings', 'people'];

/**
 * Soft accents, one per group: `base` on light paper, `onDark` on the dark
 * story card. Kept muted so the map stays calm.
 */
export const GROUP_COLORS: Record<EntityGroup, { base: string; onDark: string }> = {
  cities: { base: '#2f8a57', onDark: '#7fd4a3' },
  lands: { base: '#b07d24', onDark: '#e6be6e' },
  water: { base: '#2f6fb3', onDark: '#8cbcec' },
  buildings: { base: '#b45a36', onDark: '#eb9a78' },
  people: { base: '#82478f', onDark: '#cfa2dc' },
};

export const groupOf = (entity: HistoricalEntity): EntityGroup => GROUP_OF_KIND[entity.kind];

export const groupColor = (entity: HistoricalEntity) => GROUP_COLORS[groupOf(entity)];

/** A hex colour with an alpha channel, e.g. tint('#2f8a57', 0.12). */
export const tint = (hex: string, alpha: number) =>
  `${hex}${Math.round(Math.min(Math.max(alpha, 0), 1) * 255).toString(16).padStart(2, '0')}`;
