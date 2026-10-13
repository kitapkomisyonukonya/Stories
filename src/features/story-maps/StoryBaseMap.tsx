import { useId } from 'react';
import { BASE_MAPS } from './baseMaps';
import { PALETTE } from './palette';
import type { StoryMapBaseMapId } from './types';

/**
 * The story map's own drawing (sea, land, lakes, rivers, mountains) laid out on
 * another equirectangular frame, so a game on that frame looks like the story's
 * Map Challenge. The frame is given by its edges in degrees and its size in units.
 */
export const StoryBaseMap = ({
  baseMap,
  west,
  east,
  north,
  south,
  width,
  height,
}: {
  baseMap: StoryMapBaseMapId;
  west: number;
  east: number;
  north: number;
  south: number;
  width: number;
  height: number;
}) => {
  const uid = `base-${useId().replace(/:/g, '')}`;
  const BASE = BASE_MAPS[baseMap];
  // Both maps are equirectangular, so one scale and shift per axis carries the base map onto the frame.
  const [x0, y0] = BASE.project(west, north);
  const [x1, y1] = BASE.project(east, south);
  const a = width / (x1 - x0);
  const d = height / (y1 - y0);
  const px = 1 / a;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PALETTE.seaTop} />
          <stop offset="1" stopColor={PALETTE.seaBottom} />
        </linearGradient>
        <radialGradient id={`${uid}-land`} cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor={PALETTE.land} />
          <stop offset="1" stopColor={PALETTE.landShade} />
        </radialGradient>
        <path id={`${uid}-landpath`} d={BASE.land} fillRule="evenodd" />
      </defs>
      <rect width={width} height={height} fill={`url(#${uid}-sea)`} />
      <g transform={`matrix(${a} 0 0 ${d} ${-x0 * a} ${-y0 * d})`}>
        <use href={`#${uid}-landpath`} fill="none" stroke={PALETTE.coastGlow} strokeWidth={9} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.75} />
        <use href={`#${uid}-landpath`} fill={`url(#${uid}-land)`} stroke={PALETTE.coast} strokeWidth={0.9} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={BASE.lakes} fill={PALETTE.seaTop} stroke={PALETTE.coast} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
        <path d={BASE.rivers} fill="none" stroke={PALETTE.river} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {BASE.relief.map(([lon, lat]) => {
          const [x, y] = BASE.project(lon, lat);
          return (
            <g key={`${lon}-${lat}`} transform={`translate(${x} ${y}) scale(${px * 0.75} ${(px * 0.75 * a) / d})`} fill="none" stroke={PALETTE.relief} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
              <path d="M-13 4 L-6 -5 L0 2 L5 -3 L12 4" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
