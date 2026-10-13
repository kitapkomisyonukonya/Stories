import React, { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from '../../components/ui/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { MEDITERRANEAN_FEATURES, MEDITERRANEAN_FEATURE_VIEWBOX } from './mediterraneanFeatures';
import { WIDE_MAP_PLACEMENT, mediterraneanContextMap, wideContextMap } from './mediterraneanMap';
import type { HistoricalMapFocus } from './types';

interface MapMarker {
  id: string;
  x: number;
  y: number;
  color?: string;
}

const DEFAULT_COLOR = '#e11d48';
const [, , VIEW_WIDTH, VIEW_HEIGHT] = MEDITERRANEAN_FEATURE_VIEWBOX.split(' ').map(Number);
const MAX_ZOOM = 6;

/** Top and bottom of the lit shapes, in map percentages, so the title can sit beside them instead of on them. */
const shapesTopBottom = (paths: string[]) => {
  let top = Infinity;
  let bottom = -Infinity;
  for (const d of paths) {
    for (const [, x, y] of d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
      if (Number(x) < 0 || Number(x) > VIEW_WIDTH) continue;
      top = Math.min(top, (Number(y) / VIEW_HEIGHT) * 100);
      bottom = Math.max(bottom, (Number(y) / VIEW_HEIGHT) * 100);
    }
  }
  return Number.isFinite(top) ? { top, bottom } : undefined;
};

/**
 * A context map with the entity's place drawn on top in its group colour: a
 * glowing dot for a city or a building, the real shape of a sea, a river or an
 * island, a soft shape for a land or the lands a people ruled, and arrows for
 * where a people came from. The map zooms around the place, so the dot stays
 * where it is on the canvas. A focus with a `view` slides the map out onto the
 * wide map, e.g. to show where the Mongols came from.
 */
export const EntityMap = ({
  src,
  alt,
  focus,
  label,
  showFocus = true,
  aspect = '4 / 3',
  color = DEFAULT_COLOR,
  markers = [],
  onMarkerClick,
  onMapClick,
  tap,
  zoomable = false,
  className,
  style,
}: {
  src: string;
  alt: string;
  focus?: HistoricalMapFocus;
  label?: string;
  showFocus?: boolean;
  /** CSS aspect ratio of the map image. */
  aspect?: string;
  /** Highlight colour, usually the entity's group colour. */
  color?: string;
  /** Small dots for other places, used on the Places page overview. */
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
  /** Tap anywhere on the map; receives the point as percentages. Used by the map game. */
  onMapClick?: (x: number, y: number) => void;
  /** Where the learner tapped, shown as a small ring. */
  tap?: { x: number; y: number };
  /** Zoom buttons, and dragging the map once it is zoomed in. */
  zoomable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { t } = useLanguage();
  const glowId = `entity-glow-${useId().replace(/:/g, '')}`;
  // The reader's own zoom on top of the card's: scale and offset in percentages of the map.
  const [user, setUser] = useState({ s: 1, x: 0, y: 0 });
  const drag = useRef<{ id: number; startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null);
  const focusKey = focus ? `${focus.mode}-${focus.x}-${focus.y}` : 'none';
  useEffect(() => setUser({ s: 1, x: 0, y: 0 }), [focusKey, src]);
  const clampUser = (next: { s: number; x: number; y: number }) => {
    const s = Math.min(Math.max(next.s, 1), MAX_ZOOM);
    return { s, x: Math.min(0, Math.max(100 - 100 * s, next.x)), y: Math.min(0, Math.max(100 - 100 * s, next.y)) };
  };
  /** Zoom by a factor around the card's place (the middle of the map when it has none), so the place stays in sight. */
  const zoomBy = (factor: number) =>
    setUser(prev => {
      const s = Math.min(Math.max(prev.s * factor, 1), MAX_ZOOM);
      const ax = focus && !view ? prev.x + prev.s * (shiftX + focus.x * scale) : 50;
      const ay = focus && !view ? prev.y + prev.s * (shiftY + focus.y * scale) : 50;
      return clampUser({ s, x: ax - ((ax - prev.x) * s) / prev.s, y: ay - ((ay - prev.y) * s) / prev.s });
    });
  const arrowId = `${glowId}-arrow`;
  const featureFocus = showFocus && focus?.mode === 'feature' ? focus : undefined;
  const view = featureFocus?.view;
  // One transform for both cases, so the map glides between them:
  // zoom around the place, or slide out to the view's corner.
  const scale = view ? view.scale : showFocus && focus?.zoom ? focus.zoom : 1;
  const shiftX = view ? -view.x * scale : (focus?.x ?? 50) * (1 - scale);
  const shiftY = view ? -view.y * scale : (focus?.y ?? 50) * (1 - scale);
  /** Where a point of the map (in map percentages) is on screen. */
  const onScreen = (x: number, y: number) => ({ x: user.x + user.s * (shiftX + x * scale), y: user.y + user.s * (shiftY + y * scale) });
  // Keep the wide map once it has been shown, so sliding back stays smooth.
  const usedWide = useRef(false);
  if (view) usedWide.current = true;
  const showWide = usedWide.current && src === mediterraneanContextMap;
  const focusOnScreen = focus ? onScreen(focus.x, focus.y) : undefined;
  const labelOnLeft = (focusOnScreen?.x ?? 0) > 68;
  const shapes = (featureFocus?.features ?? [])
    .map(id => MEDITERRANEAN_FEATURES[id as keyof typeof MEDITERRANEAN_FEATURES])
    .filter(Boolean);

  // The title of a land, a sea or a people sits just above its shape (below it near the top edge),
  // so the shape itself stays in sight.
  const box = featureFocus ? shapesTopBottom(shapes.map(shape => shape.d)) : focus?.mode === 'area'
    ? { top: focus.y - focus.height / 2, bottom: focus.y + focus.height / 2 }
    : undefined;
  const boxOnScreen = box ? { top: onScreen(0, box.top).y, bottom: onScreen(0, box.bottom).y } : undefined;
  // A shape that fills the map from top to bottom keeps its title in the middle.
  const boxTop = boxOnScreen && (boxOnScreen.top >= 12 || boxOnScreen.bottom <= 88) ? boxOnScreen.top : undefined;
  const boxBottom = boxOnScreen?.bottom;
  const labelBelow = boxTop !== undefined && boxTop < 12;
  const markerScale = 1 / (scale * user.s);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomable || user.s <= 1 || (event.target as Element).closest('button')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: user.x, y: user.y, w: rect.width, h: rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    setUser(prev => clampUser({
      s: prev.s,
      x: start.x + ((event.clientX - start.startX) / start.w) * 100,
      y: start.y + ((event.clientY - start.startY) / start.h) * 100,
    }));
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onMapClick(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl bg-[#b9d3cf]', onMapClick && 'cursor-crosshair', zoomable && user.s > 1 && 'cursor-grab touch-none', className)}
      style={{ aspectRatio: aspect, ...style }}
      onClick={onMapClick ? handleClick : undefined}
      onPointerDown={zoomable ? onPointerDown : undefined}
      onPointerMove={zoomable ? onPointerMove : undefined}
      onPointerUp={zoomable ? onPointerUp : undefined}
      onPointerCancel={zoomable ? onPointerUp : undefined}
    >
      <div
        className={cn('absolute inset-0', !drag.current && 'transition-transform duration-300 ease-out motion-reduce:transition-none')}
        style={{ transform: `translate(${user.x}%, ${user.y}%) scale(${user.s})`, transformOrigin: '0 0' }}
      >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translate(${shiftX}%, ${shiftY}%) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {showWide && (
          <img
            src={wideContextMap}
            alt=""
            aria-hidden="true"
            className="absolute max-w-none"
            style={{
              left: `${WIDE_MAP_PLACEMENT.left}%`,
              top: `${WIDE_MAP_PLACEMENT.top}%`,
              width: `${WIDE_MAP_PLACEMENT.width}%`,
              height: `${WIDE_MAP_PLACEMENT.height}%`,
            }}
            draggable={false}
          />
        )}
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {featureFocus && (
          <svg
            aria-hidden="true"
            viewBox={MEDITERRANEAN_FEATURE_VIEWBOX}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id={arrowId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            </defs>
            {shapes.map((shape, index) => {
              if (shape.kind === 'line') {
                return (
                  <path key={index} d={shape.d} fill="none" stroke={color} strokeWidth={5}
                    strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
                );
              }
              if (shape.kind === 'land') {
                return (
                  <path key={index} d={shape.d} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.6}
                    strokeDasharray="6 4" strokeLinejoin="round" filter={`url(#${glowId})`} />
                );
              }
              return (
                <path key={index} d={shape.d} fill={color} fillOpacity={0.34} stroke={color} strokeWidth={2.2}
                  strokeLinejoin="round" filter={`url(#${glowId})`} />
              );
            })}
            {featureFocus.arrows?.map((arrow, index) => (
              <line
                key={`arrow-${index}`}
                x1={(arrow.fromX / 100) * VIEW_WIDTH}
                y1={(arrow.fromY / 100) * VIEW_HEIGHT}
                x2={(arrow.toX / 100) * VIEW_WIDTH}
                y2={(arrow.toY / 100) * VIEW_HEIGHT}
                stroke={color}
                strokeWidth={4}
                strokeDasharray="10 7"
                strokeLinecap="round"
                markerEnd={`url(#${arrowId})`}
              />
            ))}
          </svg>
        )}

        {featureFocus?.pins?.map(pin => (
          <span
            key={`pin-${pin.label}`}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: `scale(${markerScale})`, transformOrigin: '0 0' }}
          >
            <span className="absolute -left-[6px] -top-[6px] h-3 w-3 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: color }} />
            <span
              className={cn(
                'absolute top-0 -translate-y-1/2 whitespace-nowrap rounded bg-white/85 px-1 py-px text-[10px] font-semibold leading-tight text-stone-800 shadow-sm',
                pin.x > 70 ? 'right-[9px]' : 'left-[9px]',
              )}
            >
              {pin.label}
            </span>
          </span>
        ))}

        {markers.map(marker => (
          <button
            key={marker.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(event) => {
              event.stopPropagation();
              onMarkerClick?.(marker.id);
            }}
            className="absolute h-2.5 w-2.5 rounded-full border border-white/90 shadow-sm before:absolute before:-inset-[15px] before:rounded-full"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              backgroundColor: marker.color ?? 'rgba(15, 118, 110, 0.7)',
              transform: `translate(-50%, -50%) scale(${markerScale})`,
            }}
          />
        ))}

        {showFocus && focus?.mode === 'area' && (
          <span
            aria-hidden="true"
            className="absolute rounded-[50%] border-2 border-dashed border-rose-700/80 bg-rose-500/20"
            style={{
              left: `${focus.x}%`,
              top: `${focus.y}%`,
              width: `${focus.width}%`,
              height: `${focus.height}%`,
              transform: `translate(-50%, -50%) rotate(${focus.rotate ?? 0}deg)`,
            }}
          />
        )}
      </div>
      </div>

      {showFocus && focus?.mode === 'point' && focusOnScreen && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ left: `${focusOnScreen.x}%`, top: `${focusOnScreen.y}%` }}
        >
          <span className="absolute -left-3.5 -top-3.5 h-7 w-7 animate-ping rounded-full opacity-40" style={{ backgroundColor: color }} />
          <span
            className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white"
            style={{ backgroundColor: color, boxShadow: `0 0 10px 3px ${color}99` }}
          />
        </span>
      )}

      {tap && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-stone-900/80 bg-white/40"
          style={{ left: `${tap.x}%`, top: `${tap.y}%` }}
        />
      )}

      {showFocus && focus && focusOnScreen && label && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute whitespace-nowrap rounded-md bg-white/90 px-1.5 py-0.5 font-display text-[11px] font-bold text-stone-900 shadow-sm"
          style={{
            // A label for a shape sits just above it (below it near the top), kept off the map edge.
            left: `${focus.mode === 'point' ? focusOnScreen.x : Math.min(Math.max(focusOnScreen.x, 14), 86)}%`,
            top: `${focus.mode === 'point' || boxTop === undefined ? focusOnScreen.y : labelBelow ? boxBottom : boxTop}%`,
            transform: focus.mode === 'point'
              ? `translate(${labelOnLeft ? 'calc(-100% - 12px)' : '12px'}, -50%)`
              : boxTop === undefined
                ? 'translate(-50%, -50%)'
                : `translate(-50%, ${labelBelow ? '8px' : 'calc(-100% - 8px)'})`,
          }}
        >
          {label}
        </span>
      )}

      {zoomable && (
        // Away from the place: on the side the place is not, at the other end from a card's picture.
        <div
          className={cn(
            'absolute z-10 flex overflow-hidden rounded-lg border border-black/10 bg-white/90 shadow-sm backdrop-blur-sm',
            (focus?.x ?? 0) > 50 ? 'left-2' : 'right-2',
            (focus?.y ?? 0) > 50 ? 'bottom-2' : 'top-2',
          )}
        >
          <button type="button" onClick={() => zoomBy(1.6)} disabled={user.s >= MAX_ZOOM} aria-label={t('map.zoomIn')} title={t('map.zoomIn')} className="flex h-8 w-8 items-center justify-center font-display text-lg font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-35">+</button>
          <button type="button" onClick={() => zoomBy(1 / 1.6)} disabled={user.s <= 1} aria-label={t('map.zoomOut')} title={t('map.zoomOut')} className="flex h-8 w-8 items-center justify-center border-l border-black/10 font-display text-lg font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-35">−</button>
          <button type="button" onClick={() => setUser({ s: 1, x: 0, y: 0 })} disabled={user.s <= 1} aria-label={t('map.reset')} title={t('map.reset')} className="flex h-8 w-8 items-center justify-center border-l border-black/10 text-stone-800 hover:bg-stone-100 disabled:opacity-35">
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
