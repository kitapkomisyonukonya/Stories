import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PHONE_QUERY, useIsPhone, useSheetDrag } from '../../lib/phone';
import { AnimatePresence, motion } from 'motion/react';
import type { PageData } from '../../types';
import { getHistoricalEntity } from '../historical-entities/registry';
import { entityPictureUrl } from '../historical-entities/pictures';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';
import { ArrowRight, Check, ChevronUp, MapPin, RotateCcw, Target, Volume2, VolumeX, X } from '../../components/ui/icons';
import { isMapSoundOn, playMapSound, setMapSoundOn, subscribeMapSound } from './mapSounds';
import { BASE_MAPS } from './baseMaps';
import { PALETTE } from './palette';
import {
  MONGOL_ROUTE_END,
  MONGOL_ROUTE_START,
  OVERLAY_SHAPES,
  SELJUK_PRESSURE_SPAN,
  SELJUK_PRESSURE_START,
} from './overlays';
import { clamp, distanceKm, partialPolyline, trimPolyline, pathFromPoints } from './geometry';
import { MapGlyph } from './MapGlyph';
import { MapTimePanel } from './MapTimePanel';
import { EVENT_SETTLE, makeTimeScale } from './timeScale';
import { MapEventScene } from './MapEventScene';
import { MapChallengeOverlay, type ChallengeAnswer } from './MapChallengeOverlay';
import type { StoryMap, StoryMapCamera, StoryMapPlace } from './types';
import { useDialogFocus } from '../../hooks/useDialogFocus';

type View = { x: number; y: number; w: number; h: number };

const MAX_ZOOM = 6;
const PIN = 20;
const GOOD = '#0f8a5f';

/** How far (in map units) the base map fades into the sea at its edges. */
const EDGE_FADE = 70;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** "40 years" for the age line; Arabic says سنة / سنتين alone for 1 and 2, سنوات up to 10, سنة after. */
const yearsText = (age: number, value: string, language: string) => {
  if (language !== 'ar') return `${value} ${age === 1 ? 'year' : 'years'}`;
  if (age === 1) return 'سَنَةٍ';
  if (age === 2) return 'سَنَتَيْنِ';
  return `${value} ${age <= 10 ? 'سَنَواتٍ' : 'سَنَةً'}`;
};

const buzz = () => { try { navigator.vibrate?.(10); } catch { /* not available */ } };
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

interface StoryMapPageProps {
  page: PageData;
}

export const StoryMapPage: React.FC<StoryMapPageProps> = ({ page }) => {
  const map = page.map as StoryMap;
  const BASE = BASE_MAPS[map.baseMap];
  const { t, language, isRTL, formatNumber } = useLanguage();
  const { isTeacher } = useUserRole();
  const uid = useId().replace(/:/g, '');
  const features = map.features;
  const timeOn = features.timeSlider;

  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x: 0, y: 0, w: BASE.width, h: BASE.height });
  const viewRef = useRef(view);
  viewRef.current = view;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  const places = map.places;
  const selected = places.find(place => place.id === selectedId) ?? null;
  const selectedIndex = selected ? places.indexOf(selected) : -1;

  // --- Modes -----------------------------------------------------------------------------------
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  const [classroom, setClassroom] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [cIndex, setCIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(isMapSoundOn);
  useEffect(() => subscribeMapSound(setSoundOn), []);
  const [answers, setAnswers] = useState<ChallengeAnswer[]>([]);
  const challengeOn = mode === 'challenge';
  // Phones: the map keeps the screen; the place card is a strip under it that opens a sheet.
  const isPhone = useIsPhone();
  const [sheetOpen, setSheetOpen] = useState(false);
  const infoSheet = useSheetDrag(() => setSheetOpen(false));
  const infoSheetRef = useDialogFocus(isPhone && sheetOpen && !challengeOn, () => setSheetOpen(false));
  const [resultSlot, setResultSlot] = useState<HTMLDivElement | null>(null);
  useEffect(() => { if (challengeOn || !isPhone) setSheetOpen(false); }, [challengeOn, isPhone]);
  const question = map.challenge[cIndex];
  const answer = answers[cIndex];
  const challengeDone = challengeOn && cIndex >= map.challenge.length;
  const score = answers.filter(item => item?.correct).length;

  // --- View geometry ---------------------------------------------------------------------------
  const homeRect = useMemo(() => {
    const [x0, y0] = BASE.project(map.home.west, map.home.north);
    const [x1, y1] = BASE.project(map.home.east, map.home.south);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, [map.home]);

  // Widest view: the home area fitted to the screen, but never taller than the base map
  // (on a tall phone screen the sides are cropped instead of showing empty sea).
  const fitWidth = useCallback((aspect: number) =>
    Math.min(Math.max(homeRect.w, homeRect.h * aspect), BASE.height * aspect), [homeRect]);

  const limitWidth = useCallback((w: number, aspect: number) =>
    Math.min(fitWidth(aspect), Math.max(homeRect.w / MAX_ZOOM, w)), [homeRect, fitWidth]);

  const clampView = useCallback((next: View, aspect: number): View => {
    const w = limitWidth(next.w, aspect);
    const h = w / aspect;
    const cx = next.x + next.w / 2;
    const cy = next.y + next.h / 2;
    let x = cx - w / 2;
    let y = cy - h / 2;
    x = w >= BASE.width ? (BASE.width - w) / 2 : Math.min(Math.max(x, 0), BASE.width - w);
    y = h >= BASE.height ? (BASE.height - h) / 2 : Math.min(Math.max(y, 0), BASE.height - h);
    return { x, y, w, h };
  }, [limitWidth]);

  // Centre of the places, so a cropped home view still keeps every marker in sight.
  const placesCentre = useMemo(() => {
    const xs = map.places.map(place => BASE.project(place.lon, place.lat)[0]);
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  }, [map.places]);

  const homeView = useCallback((aspect: number): View => {
    const w = fitWidth(aspect);
    const h = w / aspect;
    const cx = w < homeRect.w ? placesCentre : homeRect.x + homeRect.w / 2;
    return clampView({ x: cx - w / 2, y: homeRect.y + homeRect.h / 2 - h / 2, w, h }, aspect);
  }, [homeRect, fitWidth, placesCentre, clampView]);

  const aspect = size.w > 0 && size.h > 0 ? size.w / size.h : BASE.width / BASE.height;
  const isHome = useMemo(() => {
    const home = homeView(aspect);
    return Math.abs(home.w - view.w) < 1 && Math.abs(home.x - view.x) < 1 && Math.abs(home.y - view.y) < 1;
  }, [aspect, homeView, view]);

  const cameraView = useCallback((camera: StoryMapCamera): View => {
    const [cx, cy] = BASE.project(camera.lon, camera.lat);
    const w = fitWidth(aspect) / camera.zoom;
    const h = w / aspect;
    return clampView({ x: cx - w / 2, y: cy - h / 2, w, h }, aspect);
  }, [fitWidth, clampView, aspect]);

  const sizedRef = useRef(false);
  const introPending = useRef(false);
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const nextAspect = rect.width / rect.height;
      if (!sizedRef.current) {
        // Open slightly closer, then settle back: the map arrives instead of just appearing.
        const home = homeView(nextAspect);
        const w = home.w * 0.8;
        const h = home.h * 0.8;
        setView(prefersReducedMotion() ? home : clampView({ x: home.x + (home.w - w) / 2, y: home.y + (home.h - h) / 2, w, h }, nextAspect));
        introPending.current = !prefersReducedMotion();
      }
      else setView(current => clampView({ ...current, h: current.w / nextAspect }, nextAspect));
      sizedRef.current = true;
      setSize({ w: rect.width, h: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [homeView, clampView]);

  // --- Animated moves: the camera and the year slider -------------------------------------------
  const animationRef = useRef<number | null>(null);
  const animationDone = useRef<(() => void) | null>(null);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    animationDone.current?.();
    animationDone.current = null;
  }, []);

  // `fly` lifts the camera on long moves (zoom out, travel, zoom in), like a map app.
  // `linear` is for slow drifts that must never look like a stop.
  const animateTo = useCallback((target: View, duration = 320, style: 'auto' | 'fly' | 'linear' = 'auto'): Promise<void> => new Promise(resolve => {
    cancelAnimation();
    if (prefersReducedMotion() || duration <= 0) { setView(target); resolve(); return; }
    animationDone.current = resolve;
    const from = viewRef.current;
    const start = performance.now();
    const fromCx = from.x + from.w / 2;
    const fromCy = from.y + from.h / 2;
    const toCx = target.x + target.w / 2;
    const toCy = target.y + target.h / 2;
    const travel = Math.hypot(toCx - fromCx, toCy - fromCy);
    const lift = style === 'fly' ? Math.min(0.55, travel / Math.max(from.w, target.w) * 0.35) : 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = style === 'linear' ? p : duration > 500 ? easeInOut(p) : 1 - Math.pow(1 - p, 3);
      const w = (from.w + (target.w - from.w) * e) * (1 + lift * Math.sin(Math.PI * e));
      const h = w / (from.w / from.h);
      const cx = fromCx + (toCx - fromCx) * e;
      const cy = fromCy + (toCy - fromCy) * e;
      setView(lift > 0 ? clampView({ x: cx - w / 2, y: cy - h / 2, w, h }, from.w / from.h) : {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      });
      if (p < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        animationDone.current = null;
        resolve();
      }
    };
    animationRef.current = requestAnimationFrame(step);
  }), [cancelAnimation, clampView]);

  useEffect(() => {
    if (size.w === 0 || !introPending.current) return;
    introPending.current = false;
    void animateTo(homeView(size.w / size.h), 2600);
  }, [size, animateTo, homeView]);

  const initialEvent = useMemo(
    // A story told in chapter steps opens at its first step, so the map does not give away the ending.
    () => (map.time.mode === 'stages' ? undefined : map.timeline.find(item => places.find(place => place.id === item.placeId)?.tone === 'event')) ?? map.timeline[0],
    [map.timeline, map.time.mode, places],
  );
  const [year, setYearState] = useState(() => (initialEvent ? initialEvent.year + EVENT_SETTLE : map.time.start));
  const yearRef = useRef(year);
  const setYear = useCallback((value: number) => { yearRef.current = value; setYearState(value); }, []);

  const yearTween = useRef<{ raf: number | null; done: (() => void) | null }>({ raf: null, done: null });
  const cancelYearTween = useCallback(() => {
    const tween = yearTween.current;
    if (tween.raf) cancelAnimationFrame(tween.raf);
    tween.raf = null;
    tween.done?.();
    tween.done = null;
  }, []);

  // The year moves along the slider at an even pace, whatever the number of years in a stretch.
  const timeScale = useMemo(() => makeTimeScale(map), [map]);
  const tweenYear = useCallback((to: number, ms: number, linear = false): Promise<void> => new Promise(resolve => {
    cancelYearTween();
    if (prefersReducedMotion() || ms <= 0) { setYear(to); resolve(); return; }
    const from = timeScale.toPos(yearRef.current);
    const target = timeScale.toPos(to);
    const start = performance.now();
    yearTween.current.done = resolve;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setYear(p >= 1 ? to : timeScale.toYear(from + (target - from) * (linear ? p : easeInOut(p))));
      if (p < 1) {
        yearTween.current.raf = requestAnimationFrame(step);
      } else {
        yearTween.current.raf = null;
        yearTween.current.done = null;
        resolve();
      }
    };
    yearTween.current.raf = requestAnimationFrame(step);
  }), [cancelYearTween, setYear, timeScale]);

  useEffect(() => () => { cancelAnimation(); cancelYearTween(); }, [cancelAnimation, cancelYearTween]);

  // --- Zoom, reveal, select ---------------------------------------------------------------------
  const tourToken = useRef(0);
  const suppressAuto = useRef(false);
  const [tourRunning, setTourRunning] = useState(false);
  /** A tour was paused before its end, so the next press of play resumes it. */
  const tourUnfinished = useRef(false);

  const stopTour = useCallback(() => {
    if (tourToken.current === 0 && !suppressAuto.current) return;
    tourToken.current += 1;
    suppressAuto.current = false;
    setTourRunning(false);
    cancelYearTween();
    cancelAnimation();
  }, [cancelAnimation, cancelYearTween]);

  const zoomBy = useCallback((factor: number, cx?: number, cy?: number, animate = true) => {
    const current = viewRef.current;
    const px = cx ?? current.x + current.w / 2;
    const py = cy ?? current.y + current.h / 2;
    const w = limitWidth(current.w * factor, aspect);
    const f = w / current.w;
    // Keep the point under the finger or cursor where it is.
    const target = clampView({ x: px - (px - current.x) * f, y: py - (py - current.y) * f, w, h: w / aspect }, aspect);
    if (animate) void animateTo(target); else setView(target);
  }, [aspect, limitWidth, clampView, animateTo]);

  const resetView = useCallback(() => { stopTour(); void animateTo(homeView(aspect)); }, [animateTo, homeView, aspect, stopTour]);

  const toMap = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return [0, 0];
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return [point.x, point.y];
  }, []);

  // Keep a selected place on screen when it is chosen from the card or the timeline.
  const revealPlace = useCallback((place: StoryMapPlace) => {
    const current = viewRef.current;
    const [px, py] = BASE.project(place.lon, place.lat);
    const margin = current.w * 0.12;
    const inside = px > current.x + margin && px < current.x + current.w - margin
      && py > current.y + margin && py < current.y + current.h - margin;
    if (inside) return;
    void animateTo(clampView({ ...current, x: px - current.w / 2, y: py - current.h / 2 }, aspect));
  }, [animateTo, clampView, aspect]);

  const selectPlace = useCallback((id: string | null, reveal = false) => {
    setSelectedId(id);
    if (!id) return;
    setVisited(previous => (previous.has(id) ? previous : new Set(previous).add(id)));
    if (classroom) setRevealed(previous => (previous.has(id) ? previous : new Set(previous).add(id)));
    const place = places.find(item => item.id === id);
    if (place && reveal) revealPlace(place);
  }, [places, revealPlace, classroom]);

  const onPinSelect = (id: string) => { stopTour(); buzz(); playMapSound('select'); selectPlace(id); };
  // Pins close together overlap on small screens: a tap goes to the pin whose centre is nearest
  // to the finger, not to whichever pin happens to be drawn on top.
  const onPinTap = (event: React.MouseEvent<SVGGElement>, id: string) => {
    const svg = event.currentTarget.ownerSVGElement;
    let best = id;
    let bestDistance = Infinity;
    svg?.querySelectorAll<SVGGElement>('[data-map-pin]').forEach(pin => {
      const body = pin.querySelector('.story-map-body') ?? pin;
      const box = body.getBoundingClientRect();
      const distance = Math.hypot(box.left + box.width / 2 - event.clientX, box.top + box.height / 2 - event.clientY);
      const pinId = pin.getAttribute('data-map-pin-id');
      if (pinId && distance < bestDistance) { bestDistance = distance; best = pinId; }
    });
    onPinSelect(best);
  };

  // --- Time: slider, events, tour ---------------------------------------------------------------
  const activeIndex = useMemo(() => {
    let found = 0;
    map.timeline.forEach((item, index) => { if (item.year <= Math.floor(year)) found = index; });
    return found;
  }, [map.timeline, year]);

  // Scrubbing past an event opens its card.
  const previousActive = useRef(activeIndex);
  useEffect(() => {
    if (previousActive.current === activeIndex) return;
    previousActive.current = activeIndex;
    if (suppressAuto.current || challengeOn || !timeOn) return;
    const placeId = map.timeline[activeIndex].placeId;
    playMapSound(places.find(place => place.id === placeId)?.tone === 'event' ? 'drum' : 'milestone');
    selectPlace(placeId);
  }, [activeIndex, challengeOn, timeOn, selectPlace, map.timeline, places]);

  const arrivalSound = useCallback((index: number) => {
    const placeId = map.timeline[index].placeId;
    playMapSound(places.find(place => place.id === placeId)?.tone === 'event' ? 'drum' : 'milestone');
  }, [map.timeline, places]);

  const goToEvent = useCallback(async (index: number, ms: number) => {
    const item = map.timeline[index];
    suppressAuto.current = true;
    playMapSound('whoosh');
    await Promise.all([
      tweenYear(item.year + EVENT_SETTLE, ms),
      // Phones: a calm glide; the lift-and-dive of the big screen looks like the map is thrashing.
      animateTo(cameraView(item.camera), Math.max(900, ms), window.matchMedia(PHONE_QUERY).matches ? 'auto' : 'fly'),
    ]);
    selectPlace(item.placeId);
    arrivalSound(index);
  }, [map.timeline, selectPlace, tweenYear, animateTo, cameraView, arrivalSound]);

  const jumpToEvent = useCallback(async (index: number) => {
    stopTour();
    const token = tourToken.current;
    const gap = Math.abs(timeScale.eventPos[index] - timeScale.toPos(yearRef.current));
    await goToEvent(index, clamp(gap * 3200, 900, 2400));
    if (tourToken.current === token) suppressAuto.current = false;
  }, [stopTour, goToEvent, timeScale]);

  // The tour never stands still: the camera lifts and flies between events, and while a card is
  // being read the camera keeps pushing in slowly and the year keeps creeping forward.
  const startTour = useCallback(async (resume = false) => {
    if (challengeOn) return;
    tourToken.current += 1;
    const token = tourToken.current;
    const alive = () => tourToken.current === token;
    suppressAuto.current = true;
    setTourRunning(true);
    tourUnfinished.current = true;
    playMapSound('start');
    // After a pause, play carries on from where the slider stands; a new tour starts at the beginning.
    const next = resume ? map.timeline.findIndex(item => item.year + EVENT_SETTLE > yearRef.current + 0.01) : -1;
    const from = next >= 0 ? next : 0;
    if (from === 0) {
      setSelectedId(null);
      // Opening: wind the clock back to the start while the camera lifts to the whole region.
      await Promise.all([
        tweenYear(map.time.start, 900),
        animateTo(homeView(aspect), 900, 'fly'),
      ]);
      if (!alive()) return;
    }
    for (let i = from; i < map.timeline.length; i += 1) {
      const item = map.timeline[i];
      // Every stretch of the line takes the same time, so 47 quiet years do not drag.
      await goToEvent(i, i === 0 ? 1500 : 2600);
      if (!alive()) return;
      // Stay long enough for the event's scene to play and the card to be read.
      const sceneTime = item.scene?.kind === 'journey' ? 7600 : item.scene?.kind === 'radiate' ? 5600 : 4400;
      const dwell = sceneTime + (language === 'ar' ? 1000 : 0);
      const here = viewRef.current;
      const push = clampView({ x: here.x + here.w * 0.05, y: here.y + here.h * 0.05, w: here.w * 0.9, h: here.h * 0.9 }, aspect);
      // Phones keep the camera still while a card is read (no slow push-in); the year still moves.
      await Promise.all([
        window.matchMedia(PHONE_QUERY).matches ? Promise.resolve() : animateTo(push, dwell, 'linear'),
        tweenYear(Math.min(item.year + 0.95, map.time.lastYear + 0.99), dwell),
      ]);
      if (!alive()) return;
    }
    tourUnfinished.current = false;
    playMapSound('whoosh');
    await animateTo(homeView(aspect), 1400, 'fly');
    if (!alive()) return;
    suppressAuto.current = false;
    setTourRunning(false);
  }, [challengeOn, map.timeline, map.time.start, map.time.lastYear, goToEvent, language, animateTo, tweenYear, homeView, aspect, clampView]);

  // Pause keeps the map exactly where it is; pressing play again carries on from there.
  // Stacked layouts (phones, tablets): the map sits above the time panel, so bring it into view
  // when the tour starts or a step is chosen; otherwise nothing would seem to happen.
  const revealMap = () => {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1023px)').matches) return;
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleTour = () => {
    if (tourRunning) { stopTour(); return; }
    revealMap();
    void startTour(tourUnfinished.current);
  };

  const scrubTo = (value: number) => {
    stopTour();
    cancelYearTween();
    suppressAuto.current = false;
    if (Math.floor(value) !== Math.floor(yearRef.current)) playMapSound('tick');
    setYear(value);
  };

  useEffect(() => () => { tourToken.current += 1; }, []);

  // --- Challenge --------------------------------------------------------------------------------
  const enterChallenge = () => {
    stopTour();
    playMapSound('start');
    setMode('challenge');
    setCIndex(0);
    setAnswers([]);
    setSelectedId(null);
    void animateTo(homeView(aspect), 400);
  };
  const exitChallenge = () => {
    setMode('explore');
    void animateTo(homeView(aspect), 400);
  };
  const restartChallenge = () => {
    setCIndex(0);
    setAnswers([]);
    void animateTo(homeView(aspect), 400);
  };
  const nextQuestion = () => {
    const next = cIndex + 1;
    playMapSound('next');
    setCIndex(next);
    if (next < map.challenge.length) void animateTo(homeView(aspect), 500);
  };

  const handleChallengeTap = (clientX: number, clientY: number) => {
    if (!challengeOn || !question || answer) return;
    const [mx, my] = toMap(clientX, clientY);
    const [lon, lat] = BASE.unproject(mx, my);
    const distance = distanceKm(lon, lat, question.lon, question.lat);
    const correct = distance <= question.radiusKm;
    setAnswers(previous => {
      const next = [...previous];
      next[cIndex] = { lon, lat, distanceKm: distance, correct };
      return next;
    });
    buzz();
    playMapSound('drop');
    window.setTimeout(() => playMapSound(correct ? 'correct' : 'wrong'), 560);
    // Show the answer and the right place together.
    const [tx, ty] = BASE.project(question.lon, question.lat);
    const r = question.radiusKm * BASE.unitsPerKm;
    const minX = Math.min(tx - r, mx);
    const maxX = Math.max(tx + r, mx);
    const minY = Math.min(ty - r, my);
    const maxY = Math.max(ty + r, my);
    const w = Math.max((maxX - minX) * 1.5, (maxY - minY) * 1.5 * aspect, fitWidth(aspect) / 3);
    const h = w / aspect;
    void animateTo(clampView({ x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2 + h * 0.08, w, h }, aspect), 650);
  };

  // --- Classroom --------------------------------------------------------------------------------
  // A drawn line shows the places it starts from, passes and has reached, so it never starts or ends on an empty spot.
  const routeShown = useMemo(() => {
    const ids = new Set<string>();
    if (!classroom) return ids;
    for (const item of map.routes) {
      const progress = timeOn ? clamp((year - item.start) / Math.max(0.01, item.end - item.start), 0, 1) : 1;
      if (progress <= 0) continue;
      const steps = item.points.slice(1).map(([lon, lat], i) => Math.hypot(lon - item.points[i][0], lat - item.points[i][1]));
      const total = steps.reduce((sum, step) => sum + step, 0);
      let along = 0;
      item.points.forEach(([lon, lat], i) => {
        if (i > 0) along += steps[i - 1];
        if (along > progress * total + 1e-6) return;
        for (const place of places) {
          if (distanceKm(place.lon, place.lat, lon, lat) <= Math.max(30, place.areaRadiusKm ?? 0)) ids.add(place.id);
        }
      });
    }
    return ids;
  }, [classroom, map.routes, places, timeOn, year]);
  const hiddenPlaces = classroom ? places.filter(place => !revealed.has(place.id) && !routeShown.has(place.id)) : [];
  const shownPlaces = classroom ? places.filter(place => revealed.has(place.id) || routeShown.has(place.id)) : places;

  // Round pictures for the pins, from each place's Places & People card. A place without one keeps its icon.
  const pictures = useMemo(() => Object.fromEntries(places.flatMap(place => {
    const entity = place.entityId ? getHistoricalEntity(place.entityId) : undefined;
    const picture = entity ? entityPictureUrl(entity) : undefined;
    return picture ? [[place.id, picture]] : [];
  })) as Record<string, string>, [places]);

  const toggleClassroom = () => {
    stopTour();
    setClassroom(on => !on);
    setRevealed(new Set());
    setSelectedId(null);
  };
  const revealNext = () => {
    const next = hiddenPlaces[0];
    if (!next) return;
    stopTour();
    buzz();
    playMapSound('reveal');
    selectPlace(next.id, true);
  };
  const hideAll = () => { playMapSound('hide'); setRevealed(new Set()); setSelectedId(null); };

  // --- Pointer: drag to pan, pinch and wheel to zoom, tap to answer ------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<number | null>(null);
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // While the hand moves the map, the wide coast glow is left out: redrawing it every frame is
  // what makes panning stutter on weak screens such as classroom boards. It comes back on release.
  const [moving, setMoving] = useState(false);
  const wheelTimer = useRef<number | null>(null);
  useEffect(() => () => { if (wheelTimer.current) window.clearTimeout(wheelTimer.current); }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    if ((event.target as Element).closest('[data-map-pin]')) return;
    stopTour();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    tapRef.current = pointers.current.size === 1 ? { x: event.clientX, y: event.clientY } : null;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const tap = tapRef.current;
    if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 6) tapRef.current = null;
    if (animationRef.current) cancelAnimation();

    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const [mx, my] = toMap((a.x + b.x) / 2, (a.y + b.y) / 2);
      setMoving(true);
      zoomBy(pinchRef.current / distance, mx, my, false);
      pinchRef.current = distance;
      return;
    }
    if (pointers.current.size === 1 && size.w > 0 && !tapRef.current) {
      const current = viewRef.current;
      const scale = current.w / size.w;
      setMoving(true);
      setView(clampView({
        ...current,
        x: current.x - (event.clientX - previous.x) * scale,
        y: current.y - (event.clientY - previous.y) * scale,
      }, aspect));
    }
  };

  const onPointerEnd = (event: React.PointerEvent) => {
    if (event.type === 'pointerup' && tapRef.current && pointers.current.size === 1) {
      handleChallengeTap(event.clientX, event.clientY);
    }
    tapRef.current = null;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) { setDragging(false); setMoving(false); }
  };

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopTour();
      const [x, y] = toMap(event.clientX, event.clientY);
      setMoving(true);
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => setMoving(false), 220);
      zoomBy(event.deltaY > 0 ? 1.18 : 1 / 1.18, x, y, false);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [toMap, zoomBy, stopTour]);

  const onDoubleClick = (event: React.MouseEvent) => {
    if (challengeOn || (event.target as Element).closest('[data-map-pin]')) return;
    const [x, y] = toMap(event.clientX, event.clientY);
    zoomBy(0.55, x, y);
  };

  const onStageKey = (event: React.KeyboardEvent) => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); stopTour(); zoomBy(0.7); }
    if (event.key === '-' || event.key === '_') { event.preventDefault(); stopTour(); zoomBy(1 / 0.7); }
    if (event.key === '0') { event.preventDefault(); resetView(); }
  };

  // --- Intro and celebration --------------------------------------------------------------------
  const [inkDone, setInkDone] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (inkDone) return;
    const timer = window.setTimeout(() => setInkDone(true), 2700);
    return () => window.clearTimeout(timer);
  }, [inkDone]);

  // --- Derived drawing values -------------------------------------------------------------------
  const px = size.w > 0 ? view.w / size.w : 1; // map units per screen pixel
  const zoomLevel = homeView(aspect).w / view.w;
  const pinScale = size.w > 0 && size.w < 520 ? 0.8 : 1;
  const showTownLabels = size.w >= 600 || zoomLevel >= 1.6;
  const zoomed = view.w < homeView(aspect).w - 1;

  const routeProgress = timeOn ? clamp((year - MONGOL_ROUTE_START) / (MONGOL_ROUTE_END - MONGOL_ROUTE_START), 0, 1) : 1;
  const pressure = timeOn ? clamp((year - SELJUK_PRESSURE_START) / SELJUK_PRESSURE_SPAN, 0, 1) : 0;
  // From 1308 the Seljuk lands were joined directly to the Ilkhanate (books that tell it only).
  const annexed = timeOn && map.overlays.includes('ilkhanate-1308') ? clamp((year - 1308) / SELJUK_PRESSURE_SPAN, 0, 1) : 0;
  const stagesMode = map.time.mode === 'stages';
  const routeDrawings = map.routes.map(item => {
    const progress = timeOn ? clamp((year - item.start) / Math.max(0.01, item.end - item.start), 0, 1) : 1;
    const colour = item.tone === 'army' ? PALETTE.mongol : 'var(--brand-600)';
    // A line that starts or ends on a marker stops at the marker's edge, so its arrow stays visible.
    const projected = item.points.map(([lon, lat]) => BASE.project(lon, lat));
    const cutAt = (point: [number, number]) => {
      const near = (lon: number, lat: number, radius: number) => {
        const [x, y] = BASE.project(lon, lat);
        return Math.hypot(x - point[0], y - point[1]) < radius * px ? radius * px : 0;
      };
      return Math.max(0, ...places.map(place => near(place.lon, place.lat, PIN + 1)), ...map.towns.map(town => near(town.lon, town.lat, 5)));
    };
    const trimmed = trimPolyline(projected, cutAt(projected[0]), cutAt(projected[projected.length - 1]));
    return { route: item, progress, colour, drawn: partialPolyline(trimmed, progress) };
  });

  const seljukPath = useMemo(() => pathFromPoints(OVERLAY_SHAPES['seljuk-1243'].points.map(([lon, lat]) => BASE.project(lon, lat)), true), []);
  const mongolPoints = useMemo(() => OVERLAY_SHAPES['mongol-1243'].points.map(([lon, lat]) => BASE.project(lon, lat)), []);
  const route = partialPolyline(mongolPoints, routeProgress);

  const scaleKm = 200;
  const scaleBarPx = (scaleKm * BASE.unitsPerKm) / px;

  const exploredText = `${t('map.explored')} ${formatNumber(visited.size)} / ${formatNumber(places.length)}`;
  const svgFont = language === 'ar' ? 'var(--font-arabic, var(--font-display))' : 'var(--font-display)';

  const shownYear = Math.min(Math.floor(year), map.time.lastYear);
  const age = shownYear - map.time.birth;
  const ageLine = !map.age || stagesMode ? null : age <= 0
    ? map.age.born
    : (shownYear >= map.time.lastYear ? map.age.died : map.age.alive).replace('{years}', yearsText(age, formatNumber(age), language));
  const activeEvent = map.timeline[activeIndex];
  const activeIsBattle = places.find(place => place.id === activeEvent?.placeId)?.tone === 'event';

  const labelOffset = (side: StoryMapPlace['labelSide']) => {
    switch (side) {
      case 'left': return { dx: -(PIN + 7), dy: 5, anchor: 'end' as const };
      case 'top': return { dx: 0, dy: -(PIN + 9), anchor: 'middle' as const };
      case 'bottom': return { dx: 0, dy: PIN + 19, anchor: 'middle' as const };
      default: return { dx: PIN + 7, dy: 5, anchor: 'start' as const };
    }
  };

  const seljukLegend = annexed > 0.5 && map.legend['ilkhanate-1308'] ? map.legend['ilkhanate-1308'] : pressure > 0.5 ? map.legend['seljuk-pressure'] : map.legend['seljuk-1243'];
  const legend = (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] leading-snug text-[#3c3428] shadow-sm backdrop-blur-sm sm:text-[12px]">
      {/* the map's own symbols: numbered place pins, and battles or events in their own colour */}
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full border border-white" style={{ background: 'var(--brand-700)' }} aria-hidden="true" />
        {t('map.legendPlace')}
      </div>
      {places.some(place => place.tone === 'event') && (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full border border-white" style={{ background: PALETTE.mongol }} aria-hidden="true" />
          {t('map.legendEvent')}
        </div>
      )}
      {map.overlays.includes('seljuk-1243') && seljukLegend && (
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-4 shrink-0 rounded-sm border border-dashed"
            style={{ background: pressure > 0.5 ? 'rgba(184,87,63,.3)' : 'rgba(224,173,72,.35)', borderColor: pressure > 0.5 ? PALETTE.mongol : PALETTE.seljuk }}
            aria-hidden="true"
          />
          {seljukLegend}
        </div>
      )}
      {map.overlays.includes('mongol-1243') && map.legend['mongol-1243'] && routeProgress > 0 && (
        <div className="flex items-center gap-2">
          <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true" className="shrink-0"><path d="M0 4 H11" stroke={PALETTE.mongol} strokeWidth="2" strokeDasharray="4 2" /><path d="M10 0.5 L15.5 4 L10 7.5 Z" fill={PALETTE.mongol} /></svg>
          {map.legend['mongol-1243']}
        </div>
      )}
      {routeDrawings.filter(item => item.progress > 0 && map.legend[`route:${item.route.id}`]).map(item => (
        <div key={item.route.id} className="flex items-center gap-2">
          <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true" className="shrink-0"><path d="M0 4 H11" stroke={item.colour} strokeWidth="2" strokeDasharray="4 2" /><path d="M10 0.5 L15.5 4 L10 7.5 Z" fill={item.colour} /></svg>
          {map.legend[`route:${item.route.id}`]}
        </div>
      ))}
      <div className="mt-0.5 opacity-70">{t('map.approximate')}</div>
    </div>
  );

  const pillButton = 'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-display text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

  const infoPanel = (
          <AnimatePresence mode="wait" initial={false}>
            {challengeOn ? (
              <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col gap-3">
                <span className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Target size={22} aria-hidden="true" />
                </span>
                <h4 className="font-display text-xl font-semibold leading-tight text-wood sm:text-2xl">{t('map.challengeTitle')}</h4>
                <ol className="flex flex-col gap-1.5" aria-label={t('map.challengeText')}>
                  {(['map.step1', 'map.step2', 'map.step3'] as const).map((key, step) => {
                    const activeStep = challengeDone ? -1 : answer ? 2 : 1;
                    const on = step === activeStep || (step === 0 && !answer && !challengeDone);
                    return (
                      <li key={key} className={cn('flex items-center gap-2.5 text-wood transition-opacity', on ? 'opacity-100' : 'opacity-45')}>
                        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold', on ? 'bg-brand-700 text-white' : 'bg-brand-200 text-brand-800')}>{formatNumber(step + 1)}</span>
                        <span className={cn('font-serif', language === 'ar' ? 'text-[16px] leading-snug' : 'text-[14px] leading-snug')}>{t(key)}</span>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-xl border border-brand-200/80 bg-white/70 px-3 py-2 text-[12px] text-wood/85">
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6.5" fill="#fff" stroke={PALETTE.mongol} strokeWidth="2.5" /></svg>
                    {t('map.yourAnswer')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="7" fill={GOOD} fillOpacity="0.2" stroke={GOOD} strokeWidth="1.8" strokeDasharray="3 2.5" /></svg>
                    {t('map.rightPlace')}
                  </span>
                </div>
                <ol className="flex flex-col gap-1.5">
                  {map.challenge.map((item, index) => {
                    const result = answers[index];
                    const current = index === cIndex && !challengeDone;
                    return (
                      <li
                        key={item.id}
                        className={cn('flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2', current ? 'border-brand-500 bg-white' : 'border-brand-200/80 bg-white/70')}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold text-white"
                          style={{ background: result ? (result.correct ? GOOD : PALETTE.mongol) : current ? 'var(--brand-700)' : 'var(--brand-300)' }}
                        >
                          {result ? (result.correct ? <Check size={14} aria-hidden="true" /> : '×') : formatNumber(index + 1)}
                        </span>
                        {/* A question opens only when its turn comes */}
                        <span className={cn('min-w-0 flex-1 text-[13px] leading-snug', result || current ? 'text-wood/85' : 'text-wood/60')}>{result || current ? item.prompt : t('map.question')}</span>
                      </li>
                    );
                  })}
                </ol>
              </motion.div>
            ) : selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ background: selected.tone === 'event' ? PALETTE.mongol : 'var(--brand-700)' }}
                  >
                    <MapGlyph icon={selected.icon} size={21} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                      {formatNumber(selectedIndex + 1)} · {selected.kind}
                    </div>
                    <h4 className="font-display text-xl font-semibold leading-tight text-wood sm:text-2xl">{selected.name}</h4>
                  </div>
                </div>

                <p className={cn('font-serif text-wood/90', language === 'ar' ? 'text-[19px] leading-[1.95]' : 'text-[16px] leading-[1.7] sm:text-[17px]')}>
                  {selected.text}
                </p>

                {isTeacher && selected.teacherNote && (
                  <div className="rounded-2xl border border-dashed border-brand-300 bg-white/70 p-3 text-[13px] leading-relaxed text-wood/80 sm:text-[14px]">
                    <div className="mb-1 flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                      <SECTION_ICONS.teacherGuide.icon size={15} aria-hidden="true" />
                      {t('map.teacherNote')}
                    </div>
                    <p>{selected.teacherNote}</p>
                  </div>
                )}

                {isTeacher && selected.question && (
                  <div className="rounded-2xl border border-brand-300/70 bg-brand-100/70 p-3 text-[14px] leading-relaxed text-wood sm:text-[15px]">
                    <div className="mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                      {t('map.askClass')}
                    </div>
                    <p className="font-semibold">{selected.question}</p>
                  </div>
                )}

                {/* The place's square picture fills the free space under the text: it sits a
                    little low, keeps a margin above and below, and shrinks when the text is long. */}
                {(() => {
                  const entity = selected.entityId ? getHistoricalEntity(selected.entityId) : undefined;
                  const picture = entity ? entityPictureUrl(entity) : undefined;
                  if (!picture) return null;
                  return (
                    <div className="flex justify-center pb-1 pt-3 lg:relative lg:min-h-[9rem] lg:flex-1 lg:p-0">
                      <div className="contents lg:absolute lg:inset-x-0 lg:bottom-2 lg:top-6 lg:flex lg:items-center lg:justify-center">
                        <img
                          src={picture}
                          alt=""
                          loading="lazy"
                          className="aspect-square w-44 rounded-2xl object-cover shadow-sm ring-1 ring-brand-200/70 sm:w-52 lg:h-full lg:max-h-64 lg:w-auto"
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { stopTour(); selectPlace(shownPlaces[(shownPlaces.indexOf(selected) - 1 + shownPlaces.length) % shownPlaces.length].id, true); }}
                    disabled={shownPlaces.length < 2}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 font-display text-[12px] font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <ArrowRight size={15} className={cn(!isRTL && 'rotate-180')} aria-hidden="true" />
                    {t('map.previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (classroom && hiddenPlaces.length > 0) { revealNext(); return; }
                      stopTour();
                      selectPlace(shownPlaces[(shownPlaces.indexOf(selected) + 1) % shownPlaces.length].id, true);
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-700 px-4 font-display text-[12px] font-semibold text-white shadow-md hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    {classroom && hiddenPlaces.length > 0 ? t('map.showNext') : t('map.next')}
                    <ArrowRight size={15} className={cn(isRTL && 'rotate-180')} aria-hidden="true" />
                  </button>
                </div>
                {visited.size === places.length && (
                  <p className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 font-display text-[12px] font-semibold text-emerald-800">
                    <Check size={15} aria-hidden="true" />
                    {t('map.allExplored')}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={classroom ? 'classroom' : 'intro'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-3"
              >
                <span className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  {classroom ? <SECTION_ICONS.classMode.icon size={22} aria-hidden="true" /> : <MapPin size={22} aria-hidden="true" />}
                </span>
                <h4 className="font-display text-xl font-semibold leading-tight text-wood sm:text-2xl">{classroom ? t('map.classroom') : t('map.startTitle')}</h4>
                <p className={cn('font-serif text-wood/80', language === 'ar' ? 'text-[18px] leading-[1.9]' : 'text-[15px] leading-[1.7] sm:text-[16px]')}>
                  {classroom ? t('map.classroomText') : t('map.startText')}
                </p>
                {classroom && (
                  <button
                    type="button"
                    onClick={revealNext}
                    disabled={hiddenPlaces.length === 0}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 font-display text-[14px] font-semibold text-white shadow-md hover:bg-brand-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    {hiddenPlaces.length === 0 ? t('map.allShown') : revealed.size === 0 ? t('map.showFirst') : t('map.showNext')}
                    {hiddenPlaces.length > 0 && <ArrowRight size={16} className={cn(isRTL && 'rotate-180')} aria-hidden="true" />}
                  </button>
                )}
                <ol className="flex flex-col gap-1.5">
                  {shownPlaces.map(place => (
                    <li key={place.id}>
                      <button
                        type="button"
                        onClick={() => { stopTour(); selectPlace(place.id, true); }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-brand-200/80 bg-white/80 px-3 py-2 text-start hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {pictures[place.id] ? (
                          <img
                            src={pictures[place.id]}
                            alt=""
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2"
                            style={{ '--tw-ring-color': place.tone === 'event' ? PALETTE.mongol : 'var(--brand-700)' } as React.CSSProperties}
                          />
                        ) : (
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ background: place.tone === 'event' ? PALETTE.mongol : 'var(--brand-700)' }}
                          >
                            <MapGlyph icon={place.icon} size={18} strokeWidth={2.1} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate font-display text-[14px] font-semibold text-wood">
                          {formatNumber(places.indexOf(place) + 1)}. {place.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-wood/55">{place.kind}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                {classroom && revealed.size > 0 && (
                  <button type="button" onClick={hideAll} className="self-start text-[12px] font-semibold text-brand-700 underline-offset-2 hover:underline">
                    {t('map.hideAll')}
                  </button>
                )}
                <p className="mt-auto text-[12px] leading-snug text-wood/55">{t('map.hint')}</p>
              </motion.div>
            )}
          </AnimatePresence>
  );

  // Phones: the chosen place in one line under the map; "More" opens the whole card from below.
  const stripPicture = selected ? pictures[selected.id] : undefined;
  const placeStrip = (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      data-map-strip
      aria-haspopup="dialog"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex w-full items-center gap-3 rounded-2xl border border-brand-200/90 bg-white px-3 pb-2.5 pt-3.5 text-start shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-black/10" aria-hidden="true" />
      {stripPicture ? (
        <img src={stripPicture} alt="" className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover" />
      ) : (
        <span
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: selected?.tone === 'event' ? PALETTE.mongol : 'var(--brand-700)' }}
        >
          {selected ? <MapGlyph icon={selected.icon} size={24} strokeWidth={2} /> : <MapPin size={24} aria-hidden="true" />}
        </span>
      )}
      <span key={selected?.id ?? 'intro'} className="story-map-fade min-w-0 flex-1" style={{ animationDuration: '.25s' }}>
        <span className={cn('block truncate font-display font-bold text-brand-700', language === 'ar' ? 'text-[12px]' : 'text-[11px] uppercase tracking-[0.08em]')}>
          {selected ? `${formatNumber(selectedIndex + 1)} · ${selected.kind} · ` : ''}{t('map.explored')} {formatNumber(visited.size)}/{formatNumber(places.length)}
        </span>
        <span className={cn('block truncate font-display font-bold leading-tight text-wood', language === 'ar' ? 'text-[17px]' : 'text-[16px]')}>
          {selected ? selected.name : t('map.startTitle')}
        </span>
        <span className={cn('block font-serif text-wood/70', language === 'ar' ? 'line-clamp-1 text-[14px] leading-snug' : 'line-clamp-1 text-[12.5px] leading-snug')}>
          {selected ? selected.text : t('map.startText')}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 font-display text-[12px] font-semibold text-brand-700">
        {t('map.more')}
        <ChevronUp size={15} aria-hidden="true" />
      </span>
    </button>
  );

  const placeSheet = isPhone && typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      {sheetOpen && !challengeOn && (
        <>
          <motion.button
            type="button"
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] cursor-default bg-black/40"
            aria-label={t('map.closeDetails')}
            onClick={() => setSheetOpen(false)}
          />
          <motion.div
            key="sheet"
            ref={infoSheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={selected?.name ?? t('map.startTitle')}
            data-map-sheet
            dir={isRTL ? 'rtl' : 'ltr'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            {...infoSheet.sheet}
            className={cn('fixed inset-x-0 bottom-0 z-[91] flex max-h-[85dvh] flex-col overflow-y-auto rounded-t-[22px] bg-brand-50 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl', language === 'ar' && 'font-arabic')}
          >
            <div className="-mx-4 flex cursor-grab items-center justify-center pb-2 pt-1" {...infoSheet.grip}>
              <span className="block h-1 w-10 rounded-full bg-black/15" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label={t('map.closeDetails')}
              className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-wood/60 shadow-sm"
            >
              <X size={14} aria-hidden="true" />
            </button>
            {infoPanel}
            <div className="mt-4">{legend}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  ) : null;

  // --- Render -----------------------------------------------------------------------------------
  return (
    <div className="h-full min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <style>{`
        @keyframes story-map-pulse { 0% { transform: scale(1); opacity: .55 } 100% { transform: scale(1.75); opacity: 0 } }
        @keyframes story-map-march { to { stroke-dashoffset: -28 } }
        @keyframes story-map-ink { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes story-map-landfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes story-map-drop { 0% { transform: translateY(-46px) scale(.5); opacity: 0 } 55% { transform: translateY(0) scale(1); opacity: 1 } 72% { transform: translateY(-7px) scale(1.04) } 86% { transform: translateY(0) scale(.98) } 100% { transform: none; opacity: 1 } }
        @keyframes story-map-land { 0% { transform: scale(.6); opacity: .7 } 100% { transform: scale(2.4); opacity: 0 } }
        @keyframes story-map-ripple { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(2.6); opacity: 0 } }
        @keyframes story-map-pop { 0% { transform: scale(.2) } 60% { transform: scale(1.35) } 100% { transform: scale(1) } }
        @keyframes story-map-grow { 0% { transform: scale(0); opacity: 0 } 65% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes story-map-line { from { stroke-dashoffset: var(--len) } to { stroke-dashoffset: 0 } }
        @keyframes story-map-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes story-map-tapring { 0% { transform: scale(.6); opacity: .85 } 100% { transform: scale(4.2); opacity: 0 } }
        @keyframes story-map-pinland { 0% { transform: translateY(-34px) scale(.4); opacity: 0 } 55% { transform: translateY(0) scale(1.08); opacity: 1 } 75% { transform: translateY(-5px) } 100% { transform: none; opacity: 1 } }
        @keyframes story-map-shake { 0%, 100% { transform: translateX(0) } 20% { transform: translateX(-5px) } 40% { transform: translateX(5px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(2px) } }
        @keyframes story-map-cue { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,.5) } 50% { transform: scale(1.12); box-shadow: 0 0 0 7px rgba(255,255,255,0) } }
        .story-map-pulse { transform-box: fill-box; transform-origin: center; animation: story-map-pulse 2.6s ease-out infinite; }
        .story-map-march { animation: story-map-march 1.6s linear infinite; }
        .story-map-ink { animation: story-map-ink 2.1s ease-in-out both; }
        .story-map-landfade { animation: story-map-landfade 1.5s ease-out .6s both; }
        .story-map-drop { transform-box: fill-box; transform-origin: 50% 100%; animation: story-map-drop .75s cubic-bezier(.3,.7,.4,1) both; }
        .story-map-land { transform-box: fill-box; transform-origin: center; animation: story-map-land .7s ease-out both; opacity: 0; }
        .story-map-ripple { transform-box: fill-box; transform-origin: center; animation: story-map-ripple 1s ease-out both; }
        .story-map-pop { transform-box: fill-box; transform-origin: center; animation: story-map-pop .45s cubic-bezier(.3,1.6,.5,1) both; }
        .story-map-grow { transform-box: fill-box; transform-origin: center; animation: story-map-grow .7s cubic-bezier(.2,.9,.3,1.2) .55s both; }
        .story-map-line { animation: story-map-line .5s ease-out .3s both; }
        .story-map-fade { animation: story-map-fade .4s ease-out both; opacity: 0; }
        .story-map-tapring { transform-box: fill-box; transform-origin: center; animation: story-map-tapring .8s ease-out both; }
        .story-map-pinland { transform-box: fill-box; transform-origin: center; animation: story-map-pinland .55s cubic-bezier(.3,.8,.4,1) both; }
        .story-map-shake { animation: story-map-pinland .55s cubic-bezier(.3,.8,.4,1) both, story-map-shake .45s ease-in-out .6s both; }
        .story-map-cue { animation: story-map-cue 1.6s ease-in-out infinite; }
        .story-map-selring { transform-box: fill-box; transform-origin: center; opacity: 0; transform: scale(.7); transition: opacity .25s, transform .35s cubic-bezier(.3,1.5,.5,1); }
        .story-map-selring[data-on="1"] { opacity: 1; transform: scale(1); }
        .story-map-body { transform-box: fill-box; transform-origin: center; transition: transform .3s cubic-bezier(.3,1.5,.5,1); }
        .story-map-body[data-on="1"] { transform: scale(1.14); }
        [data-map-pin]:hover .story-map-body[data-on="0"] { transform: scale(1.07); }
        [data-map-pin]:focus-visible .story-map-selring { opacity: 1; transform: scale(1); }
        .story-map-range { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; margin: 0; background: transparent; cursor: pointer; }
        .story-map-range::-webkit-slider-runnable-track { height: 6px; border-radius: 999px; background: linear-gradient(to right, var(--brand-600) var(--p), var(--brand-200) var(--p)); }
        .story-map-range::-moz-range-track { height: 6px; border-radius: 999px; background: linear-gradient(to right, var(--brand-600) var(--p), var(--brand-200) var(--p)); }
        .story-map-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; margin-top: -8px; border-radius: 999px; background: var(--brand-700); border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
        .story-map-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 999px; background: var(--brand-700); border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
        .story-map-range:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 4px; border-radius: 999px; }
        @media (prefers-reduced-motion: reduce) { .story-map-pulse, .story-map-march, .story-map-ink, .story-map-landfade, .story-map-drop, .story-map-land, .story-map-ripple, .story-map-pop, .story-map-line, .story-map-tapring, .story-map-pinland, .story-map-shake, .story-map-cue { animation: none; } .story-map-grow, .story-map-fade { animation: none; opacity: 1; } }
      `}</style>

      {/* Title row, matching the chapter pages */}
      <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3 sm:mb-5 shrink-0 max-sm:hidden', isRTL && 'text-right')}>
        {/* Phones: the map's name is already in the top bar. */}
        <div className="min-w-0 max-sm:hidden">
          <h3 className="font-display text-xl sm:text-3xl lg:text-4xl text-wood font-semibold tracking-[-0.03em] leading-tight">
            {page.title}
          </h3>
          <p className={cn('mt-0.5 flex items-center gap-1.5 font-serif text-xs sm:text-base lg:text-lg text-brand-600', language !== 'ar' && 'italic')}>
            <MapPin size={16} aria-hidden="true" className="shrink-0 not-italic" />
            {page.subtitle ?? t('map.label')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {features.classroom && isTeacher && !challengeOn && (
            <button
              type="button"
              onClick={toggleClassroom}
              aria-pressed={classroom}
              className={cn(pillButton, classroom ? 'border-transparent bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50')}
            >
              <SECTION_ICONS.classMode.icon size={15} aria-hidden="true" />
              {t('map.classroom')}
            </button>
          )}
          {features.challenge && map.challenge.length > 0 && (
            <button
              type="button"
              onClick={challengeOn ? exitChallenge : enterChallenge}
              aria-pressed={challengeOn}
              className={cn(pillButton, challengeOn ? 'border-transparent bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50')}
            >
              <Target size={15} aria-hidden="true" />
              {challengeOn ? t('map.backToMap') : t('map.challenge')}
            </button>
          )}
          {!challengeOn && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/90 px-3 font-display text-[12px] font-semibold text-brand-800">
              <span className="flex gap-1" aria-hidden="true">
                {places.map(place => (
                  <span key={place.id} className={cn('h-1.5 w-1.5 rounded-full', visited.has(place.id) ? 'bg-brand-600' : 'bg-brand-200')} />
                ))}
              </span>
              {exploredText}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,370px)] lg:grid-rows-[minmax(0,1fr)_auto]">
        {/* Map */}
        <div
          ref={stageRef}
          data-no-swipe
          tabIndex={0}
          onKeyDown={onStageKey}
          aria-label={page.title}
          className={cn('relative h-[52svh] min-h-[300px] max-lg:order-1', challengeOn ? 'max-sm:h-[64svh]' : 'max-sm:h-[55svh]', ' lg:h-auto lg:min-h-0 lg:col-start-1 lg:row-start-1 overflow-hidden rounded-[1.5rem] border border-brand-200/80 shadow-[0_14px_40px_rgba(63,49,28,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500')}
          style={{ background: PALETTE.seaBottom, touchAction: zoomed || challengeOn ? 'none' : 'pan-y' }}
        >
          <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            preserveAspectRatio="xMidYMid meet"
            className={cn('absolute inset-0 h-full w-full select-none', dragging ? 'cursor-grabbing' : challengeOn && !answer ? 'cursor-crosshair' : 'cursor-grab')}
            style={{ direction: 'ltr' }}
            role="presentation"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onDoubleClick={onDoubleClick}
          >
            <defs>
              <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PALETTE.seaTop} />
                <stop offset="1" stopColor={PALETTE.seaBottom} />
              </linearGradient>
              <radialGradient id={`${uid}-land`} cx="0.45" cy="0.4" r="0.75">
                <stop offset="0" stopColor={PALETTE.land} />
                <stop offset="1" stopColor={PALETTE.landShade} />
              </radialGradient>
              <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id={`${uid}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#3c3428" floodOpacity="0.28" />
              </filter>
              <pattern id={`${uid}-hatch`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="9" stroke={PALETTE.mongol} strokeWidth="2" opacity="0.65" />
              </pattern>
              <path id={`${uid}-landpath`} d={BASE.land} fillRule="evenodd" pathLength={1} />
            </defs>

            <rect x={-BASE.width} y={-BASE.height} width={BASE.width * 3} height={BASE.height * 3} fill={`url(#${uid}-sea)`} />

            {/* Coastline: drawn in ink first, then the land colour fills in */}
            {!inkDone && (
              <use href={`#${uid}-landpath`} className="story-map-ink" fill="none" stroke={PALETTE.coast} strokeWidth={2.4 * px} strokeLinejoin="round" strokeDasharray="1 2" />
            )}
            <g className={inkDone ? undefined : 'story-map-landfade'}>
              {!moving && <use href={`#${uid}-landpath`} fill="none" stroke={PALETTE.coastGlow} strokeWidth={9} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.75} />}
              <use href={`#${uid}-landpath`} fill={`url(#${uid}-land)`} stroke={PALETTE.coast} strokeWidth={0.9} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={BASE.lakes} fill={PALETTE.seaTop} stroke={PALETTE.coast} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              <path d={BASE.rivers} fill="none" stroke={PALETTE.river} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

              {/* Relief glyphs */}
              {BASE.relief.map(([lon, lat]) => {
                const [x, y] = BASE.project(lon, lat);
                return (
                  <g key={`${lon}-${lat}`} transform={`translate(${x} ${y}) scale(${px})`} fill="none" stroke={PALETTE.relief} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
                    <path d="M-13 4 L-6 -5 L0 2 L5 -3 L12 4" />
                  </g>
                );
              })}
            </g>

            {/* The base map fades into the sea at its edges, so a wide screen never shows a cut coastline */}
            <g pointerEvents="none" aria-hidden="true">
              {([
                ['l', 1, 0, 0, 0],
                ['r', 0, 0, 1, 0],
                ['t', 0, 1, 0, 0],
                ['b', 0, 0, 0, 1],
              ] as const).map(([side, x1, y1, x2, y2]) => (
                <linearGradient key={side} id={`${uid}-edge-${side}`} x1={x1} y1={y1} x2={x2} y2={y2}>
                  <stop offset="0" stopColor={PALETTE.seaBottom} stopOpacity="0" />
                  <stop offset="1" stopColor={PALETTE.seaBottom} stopOpacity="1" />
                </linearGradient>
              ))}
              <rect x={-BASE.width} y={-BASE.height} width={BASE.width} height={BASE.height * 3} fill={PALETTE.seaBottom} />
              <rect x={BASE.width} y={-BASE.height} width={BASE.width} height={BASE.height * 3} fill={PALETTE.seaBottom} />
              <rect x={0} y={-BASE.height} width={BASE.width} height={BASE.height} fill={PALETTE.seaBottom} />
              <rect x={0} y={BASE.height} width={BASE.width} height={BASE.height} fill={PALETTE.seaBottom} />
              <rect x={0} y={0} width={EDGE_FADE} height={BASE.height} fill={`url(#${uid}-edge-l)`} />
              <rect x={BASE.width - EDGE_FADE} y={0} width={EDGE_FADE} height={BASE.height} fill={`url(#${uid}-edge-r)`} />
              <rect x={0} y={0} width={BASE.width} height={EDGE_FADE} fill={`url(#${uid}-edge-t)`} />
              <rect x={0} y={BASE.height - EDGE_FADE} width={BASE.width} height={EDGE_FADE} fill={`url(#${uid}-edge-b)`} />
            </g>

            {/* Historical overlays: they follow the year on the slider */}
            {!challengeOn && map.overlays.includes('seljuk-1243') && (
              <g>
                <path d={seljukPath} fill={PALETTE.seljuk} opacity={0.26 * (1 - pressure * 0.75)} filter={`url(#${uid}-soft)`} />
                <path d={seljukPath} fill={PALETTE.mongol} opacity={0.18 * pressure + 0.14 * annexed} filter={`url(#${uid}-soft)`} />
                <path d={seljukPath} fill={`url(#${uid}-hatch)`} opacity={0.4 * pressure} />
                <path d={seljukPath} fill="none" stroke={PALETTE.seljuk} strokeWidth={1.6} strokeDasharray="2 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.9 * (1 - pressure)} />
                <path d={seljukPath} fill="none" stroke={PALETTE.mongol} strokeWidth={1.6} strokeDasharray="2 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.85 * pressure} />
              </g>
            )}

            {!challengeOn && map.overlays.includes('mongol-1243') && routeProgress > 0.001 && (
              <g>
                <path d={pathFromPoints(route.points)} fill="none" stroke={PALETTE.halo} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.7} />
                <path className="story-map-march" d={pathFromPoints(route.points)} fill="none" stroke={PALETTE.mongol} strokeWidth={2.6} strokeDasharray="9 5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <g transform={`translate(${route.tip[0]} ${route.tip[1]}) rotate(${route.angle}) scale(${px})`}>
                  <path d="M-9 -7 L3 0 L-9 7 Z" fill={PALETTE.mongol} stroke={PALETTE.halo} strokeWidth={1.4} strokeLinejoin="round" />
                </g>
              </g>
            )}

            {/* Journeys and campaigns that draw themselves along the time line */}
            {!challengeOn && routeDrawings.filter(item => item.progress > 0.001).map(({ route: item, drawn, colour }) => (
              <g key={item.id}>
                <path d={pathFromPoints(drawn.points)} fill="none" stroke={PALETTE.halo} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.7} />
                <path className="story-map-march" d={pathFromPoints(drawn.points)} fill="none" stroke={colour} strokeWidth={2.6} strokeDasharray={item.tone === 'army' ? '9 5' : '6 6'} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <g transform={`translate(${drawn.tip[0]} ${drawn.tip[1]}) rotate(${drawn.angle}) scale(${px})`}>
                  <path d="M-9 -7 L3 0 L-9 7 Z" fill={colour} stroke={PALETTE.halo} strokeWidth={1.4} strokeLinejoin="round" />
                </g>
              </g>
            ))}

            {/* Regions that are always shown as soft areas */}
            {!challengeOn && shownPlaces.filter(place => place.showArea && place.areaRadiusKm && place.id !== selectedId).map(place => {
              const [x, y] = BASE.project(place.lon, place.lat);
              return (
                <circle key={`area-${place.id}`} cx={x} cy={y} r={(place.areaRadiusKm ?? 0) * BASE.unitsPerKm} fill="var(--brand-500)" fillOpacity={0.06} stroke="var(--brand-600)" strokeOpacity={0.3} strokeWidth={1.2} strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
              );
            })}

            {/* Sea names (hidden in the challenge, like every other name, so a question never shows its answer) */}
            {!challengeOn && map.seas.map(sea => {
              const [x, y] = BASE.project(sea.lon, sea.lat);
              return (
                <text key={sea.id} transform={`translate(${x} ${y}) scale(${px})`} textAnchor="middle" fill={PALETTE.sea} fontSize={14} fontStyle={language === 'ar' ? 'normal' : 'italic'} letterSpacing={language === 'ar' ? 0 : 1.5} style={{ fontFamily: svgFont }} opacity={0.9}>
                  {sea.name}
                </text>
              );
            })}

            {/* Selected region wash */}
            {!challengeOn && selected?.areaRadiusKm && (() => {
              const [x, y] = BASE.project(selected.lon, selected.lat);
              const r = selected.areaRadiusKm * BASE.unitsPerKm;
              return (
                <circle cx={x} cy={y} r={r} fill="var(--brand-500)" fillOpacity={0.12} stroke="var(--brand-600)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
              );
            })()}

            {/* The current event's scene: every date on the time line shows something happening */}
            {!challengeOn && timeOn && activeEvent?.scene && Math.floor(year) >= activeEvent.year && (
              <MapEventScene key={`scene-${activeEvent.year}`} scene={activeEvent.scene} map={map} base={BASE} px={px} uid={`${uid}-s${activeEvent.year}`} />
            )}

            {/* Reference towns (hidden in the challenge: the map asks for some of them) */}
            {!challengeOn && map.towns.map(town => {
              const [x, y] = BASE.project(town.lon, town.lat);
              return (
                <g key={town.id} transform={`translate(${x} ${y}) scale(${px})`}>
                  <circle r={3.4} fill={PALETTE.halo} stroke={PALETTE.label} strokeWidth={1.4} />
                  {showTownLabels && (
                    <text x={town.labelSide === 'bottom' ? 0 : 7} y={town.labelSide === 'bottom' ? 17 : 4} textAnchor={town.labelSide === 'bottom' ? 'middle' : 'start'} fontSize={12} fill={PALETTE.label} stroke={PALETTE.halo} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round" style={{ fontFamily: svgFont }}>
                      {town.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Places */}
            {!challengeOn && shownPlaces.map(place => {
              const index = places.indexOf(place);
              const [x, y] = BASE.project(place.lon, place.lat);
              const isSelected = place.id === selectedId;
              const isVisited = visited.has(place.id);
              const fill = place.tone === 'event' ? PALETTE.mongol : 'var(--brand-700)';
              const label = labelOffset(place.labelSide);
              return (
                <g
                  key={place.id}
                  data-map-pin
                  data-map-pin-id={place.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${formatNumber(index + 1)}. ${place.name}`}
                  transform={`translate(${x} ${y}) scale(${px * pinScale})`}
                  className="cursor-pointer outline-none [&:focus-visible_circle.ring]:opacity-100"
                  onClick={event => onPinTap(event, place.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPinSelect(place.id); }
                  }}
                >
                  <g className="story-map-drop" style={{ animationDelay: `${(classroom ? 0 : 0.9) + (classroom ? 0 : index * 0.14)}s` }}>
                    {!classroom && <circle className="story-map-land" r={PIN} fill="none" stroke={fill} strokeWidth={2.5} style={{ animationDelay: `${0.9 + index * 0.14 + 0.38}s` }} />}
                    {!isVisited && !isSelected && (
                      <circle className="story-map-pulse" r={PIN + 1} fill="none" stroke={fill} strokeWidth={2} />
                    )}
                    {isSelected && <circle key={`rp-${tourRunning}-${selectedId}`} className="story-map-ripple" r={PIN} fill="none" stroke={fill} strokeWidth={2.5} />}
                    <circle className="ring story-map-selring" r={PIN + 6} fill="none" stroke="var(--brand-500)" strokeWidth={2.5} data-on={isSelected ? '1' : '0'} />
                    <g className="story-map-body" data-on={isSelected ? '1' : '0'} filter={`url(#${uid}-shadow)`}>
                      <circle r={PIN + 2.5} fill="#fffdf7" />
                      {pictures[place.id] ? (
                        <>
                          {/* The place's own picture, round, in place of the small icon. */}
                          <clipPath id={`${uid}-pic-${place.id}`}>
                            <circle r={PIN - 1} />
                          </clipPath>
                          <circle r={PIN - 1} fill={fill} />
                          <image href={pictures[place.id]} x={-(PIN - 1)} y={-(PIN - 1)} width={(PIN - 1) * 2} height={(PIN - 1) * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}-pic-${place.id})`} />
                          <circle r={PIN - 1} fill="none" stroke={fill} strokeWidth={2.2} />
                        </>
                      ) : (
                        <>
                          <circle r={PIN - 1} fill={fill} />
                          <g color="#ffffff">
                            <MapGlyph icon={place.icon} size={22} x={-11} y={-11} strokeWidth={2} />
                          </g>
                        </>
                      )}
                      <g transform={`translate(${PIN - 2} ${-(PIN - 2)})`}>
                        <g key={isVisited ? 'seen' : 'new'} className={isVisited ? 'story-map-pop' : undefined}>
                        <circle r={8.5} fill={isVisited ? GOOD : '#fffdf7'} stroke={isVisited ? '#fffdf7' : fill} strokeWidth={1.6} />
                        {isVisited ? (
                          <path d="M-3.6 0.2 L-1 2.8 L3.8 -2.4" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <text y={3.8} textAnchor="middle" fontSize={11} fontWeight={700} fill={fill} style={{ fontFamily: 'var(--font-display)' }}>
                            {formatNumber(index + 1)}
                          </text>
                        )}
                        </g>
                      </g>
                    </g>
                    {isPhone && isSelected ? (() => {
                      // Phones: the chosen place's name as a filled pill, so the choice is plain to see.
                      const width = place.name.replace(/[\u064B-\u0652\u0670]/g, '').length * (language === 'ar' ? 8.4 : 9.2) + 22;
                      const left = label.anchor === 'start' ? label.dx - 6 : label.anchor === 'end' ? label.dx + 6 - width : label.dx - width / 2;
                      return (
                        <g className="story-map-fade" style={{ animationDuration: '.2s' }} data-map-selected-label>
                          <rect x={left} y={label.dy - 18} width={width} height={26} rx={13} fill="var(--brand-700)" stroke="#fffdf7" strokeWidth={2} />
                          <text x={left + width / 2} y={label.dy} textAnchor="middle" fontSize={16} fontWeight={700} fill="#ffffff" style={{ fontFamily: svgFont }}>
                            {place.name}
                          </text>
                        </g>
                      );
                    })() : <text
                      x={label.dx}
                      y={label.dy}
                      textAnchor={label.anchor}
                      fontSize={isSelected ? 15 : 14}
                      fontWeight={isSelected ? 700 : 600}
                      fill={PALETTE.label}
                      stroke={PALETTE.halo}
                      strokeWidth={4}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      style={{ fontFamily: svgFont }}
                    >
                      {place.name}
                    </text>}
                  </g>
                </g>
              );
            })}

            {/* Challenge: your tap, the right place, and the distance between them. It plays out in order:
                your pin lands, a line draws, the green circle grows, then the labels appear. */}
            {challengeOn && answer && question && (() => {
              const [tx, ty] = BASE.project(question.lon, question.lat);
              const [ax, ay] = BASE.project(answer.lon, answer.lat);
              const r = question.radiusKm * BASE.unitsPerKm;
              const colour = answer.correct ? GOOD : PALETTE.mongol;
              const length = Math.hypot(tx - ax, ty - ay);
              const km = `${formatNumber(Math.round(answer.distanceKm))} ${t('map.km')}`;
              const tag = (text: string, fill: string, y: number, delay: string) => (
                <text y={y} textAnchor="middle" fontSize={12} fontWeight={700} fill={fill} stroke={PALETTE.halo} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round" className="story-map-fade" style={{ fontFamily: svgFont, animationDelay: delay }}>
                  {text}
                </text>
              );
              return (
                <g key={`answer-${cIndex}`}>
                  <g transform={`translate(${tx} ${ty})`}>
                    <circle className="story-map-grow" r={r} fill={GOOD} fillOpacity={0.18} stroke={GOOD} strokeWidth={2.2} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
                  </g>
                  {!answer.correct && length > 1 && (
                    <line
                      className="story-map-line"
                      x1={ax} y1={ay} x2={tx} y2={ty}
                      stroke={PALETTE.label} strokeOpacity={0.6} strokeWidth={2 * px} strokeLinecap="round"
                      strokeDasharray={length}
                      style={{ '--len': length } as React.CSSProperties}
                    />
                  )}
                  <g transform={`translate(${tx} ${ty}) scale(${px})`}>
                    <circle className="story-map-fade" r={5} fill={GOOD} stroke="#fff" strokeWidth={2} style={{ animationDelay: '0.6s' }} />
                  </g>
                  <g transform={`translate(${tx} ${ty - r}) scale(${px})`}>{tag(t('map.rightPlace'), GOOD, -9, '0.95s')}</g>
                  {!answer.correct && length > 1 && (
                    <g transform={`translate(${(ax + tx) / 2} ${(ay + ty) / 2}) scale(${px})`} className="story-map-fade" style={{ animationDelay: '0.95s' }}>
                      <rect x={-27} y={-11} width={54} height={22} rx={11} fill="#fffdf7" stroke={PALETTE.label} strokeOpacity={0.35} />
                      <text y={4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={PALETTE.label} style={{ fontFamily: svgFont }}>{km}</text>
                    </g>
                  )}
                  <g transform={`translate(${ax} ${ay}) scale(${px})`}>
                    <circle className="story-map-tapring" r={11} fill="none" stroke={colour} strokeWidth={2.5} />
                    <circle className="story-map-tapring" r={11} fill="none" stroke={colour} strokeWidth={2.5} style={{ animationDelay: '0.14s' }} />
                    <g className={answer.correct ? 'story-map-pinland' : 'story-map-pinland story-map-shake'} filter={`url(#${uid}-shadow)`}>
                      <circle r={11} fill="#fff" stroke={colour} strokeWidth={3.5} />
                      {answer.correct
                        ? <path d="M-4.5 0.4 L-1.4 3.4 L4.6 -3" fill="none" stroke={colour} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M-4 -4 L4 4 M4 -4 L-4 4" fill="none" stroke={colour} strokeWidth={2.6} strokeLinecap="round" />}
                    </g>
                    {tag(t('map.yourAnswer'), colour, 30, '0.5s')}
                  </g>
                </g>
              );
            })()}
          </svg>

          {/* Compass */}
          <div className="pointer-events-none absolute left-3 top-3 flex h-11 w-11 max-sm:hidden flex-col items-center justify-center rounded-full border border-white/70 bg-white/60 font-display text-[10px] font-bold text-[#5f8f9c] shadow-sm backdrop-blur-sm" aria-hidden="true" dir="ltr">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2 L15 12 L12 10.5 L9 12 Z" fill="#b8573f" /><path d="M12 22 L9 12 L12 13.5 L15 12 Z" fill="#9fb9c0" /></svg>
            N
          </div>

          {/* Phones: the challenge (and class mode) as small pills where the compass sits */}
          {isPhone && !challengeOn && (
            <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
              {features.challenge && map.challenge.length > 0 && (
                <button type="button" onClick={enterChallenge} data-map-challenge className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 font-display text-[12px] font-semibold text-brand-800 shadow-md">
                  <Target size={15} aria-hidden="true" />
                  {t('map.challenge')}
                </button>
              )}
              {features.classroom && isTeacher && (
                <button type="button" onClick={toggleClassroom} aria-pressed={classroom} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-display text-[12px] font-semibold shadow-md', classroom ? 'border-transparent bg-brand-700 text-white' : 'border-white/70 bg-white/95 text-brand-800')}>
                  <SECTION_ICONS.classMode.icon size={15} aria-hidden="true" />
                  {t('map.classroom')}
                </button>
              )}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 max-sm:right-2 max-sm:top-2 z-10 flex flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white/90 shadow-md backdrop-blur-sm">
            <button type="button" onClick={() => { stopTour(); zoomBy(0.7); }} aria-label={t('map.zoomIn')} title={t('map.zoomIn')} className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center font-display text-xl font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">+</button>
            <span className="mx-2 h-px bg-brand-100" aria-hidden="true" />
            <button type="button" onClick={() => { stopTour(); zoomBy(1 / 0.7); }} disabled={!zoomed} aria-label={t('map.zoomOut')} title={t('map.zoomOut')} className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center font-display text-xl font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">−</button>
            <span className="mx-2 h-px bg-brand-100" aria-hidden="true" />
            <button type="button" onClick={() => setMapSoundOn(!soundOn)} aria-pressed={soundOn} aria-label={soundOn ? t('map.soundOff') : t('map.soundOn')} title={soundOn ? t('map.soundOff') : t('map.soundOn')} className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <span className="mx-2 h-px bg-brand-100" aria-hidden="true" />
            <button type="button" onClick={resetView} disabled={isHome} aria-label={t('map.reset')} title={t('map.reset')} className="flex h-11 w-11 max-sm:h-10 max-sm:w-10 items-center justify-center text-brand-800 hover:bg-brand-50 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
              <RotateCcw size={18} />
            </button>
          </div>

          {/* The year and what is happening in it */}
          {timeOn && !challengeOn && isPhone && ageLine && (
            <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[60%] rounded-xl bg-white/88 px-2.5 py-1 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={cn('text-[#3c3428]/80', language === 'ar' ? 'text-[13px] leading-snug' : 'text-[11px] leading-snug')}>{ageLine}</div>
            </div>
          )}
          {timeOn && !challengeOn && !isPhone && (
            <div className="pointer-events-none absolute left-[64px] right-[64px] top-3 z-10 flex justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="max-w-full rounded-2xl border border-white/70 bg-white/88 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 font-display text-[13px] font-bold text-[#3c3428] sm:text-[14px]">
                  <span className="tabular-nums" style={{ color: activeIsBattle ? PALETTE.mongol : 'var(--brand-700)' }}>
                    {stagesMode
                      ? (activeEvent?.chapter ? t('map.chapterShort').replace('{n}', formatNumber(activeEvent.chapter)) : formatNumber(activeIndex + 1))
                      : formatNumber(shownYear)}
                  </span>
                  <span className="truncate font-semibold">{activeEvent?.label}</span>
                </div>
                {ageLine && <div className={cn('text-[#3c3428]/75', language === 'ar' ? 'text-[13px] leading-snug' : 'text-[11px] sm:text-[12px]')}>{ageLine}</div>}
              </div>
            </div>
          )}

          {/* Legend and scale */}
          {!challengeOn && (
            <div className="pointer-events-none absolute bottom-3 start-3 end-3 flex flex-wrap items-end justify-between gap-2">
              <div className="hidden sm:block">{legend}</div>
              <div className="ms-auto rounded-lg bg-white/75 px-2 py-1 text-[11px] font-semibold text-[#3c3428] shadow-sm backdrop-blur-sm" dir="ltr">
                <div className="h-1.5 border-x-2 border-b-2 border-[#3c3428]/70" style={{ width: `${Math.max(24, Math.min(160, scaleBarPx))}px` }} aria-hidden="true" />
                <div className="mt-0.5 text-center">{formatNumber(scaleKm)} {t('map.km')}</div>
              </div>
            </div>
          )}

          {challengeOn && (
            <MapChallengeOverlay
              question={question}
              index={cIndex}
              total={map.challenge.length}
              answer={answer}
              results={answers}
              done={challengeDone}
              score={score}
              onNext={nextQuestion}
              onRetry={restartChallenge}
              onExit={exitChallenge}
              compact={isPhone}
              resultSlot={resultSlot}
            />
          )}
        </div>

        {/* Info card (phones: the strip and sheet below) */}
        {!isPhone && <aside
          className="min-w-0 max-lg:order-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:overflow-y-auto custom-scrollbar rounded-[1.5rem] border border-brand-200/90 bg-brand-50/88 p-4 sm:p-5 shadow-[0_10px_30px_rgba(63,49,28,0.10)] flex flex-col"
          aria-live="polite"
        >
          {infoPanel}
        </aside>}

        {/* Phones: the challenge's hint and result, under the map */}
        {isPhone && challengeOn && !challengeDone && <div ref={setResultSlot} className="max-lg:order-2" />}

        {/* Place strip (phones) and the time panel */}
        {!challengeOn && (
          <div className="min-w-0 flex flex-col gap-3 max-lg:order-2 max-sm:-mt-1 lg:col-start-1 lg:row-start-2">
            {isPhone && placeStrip}
            {timeOn && (
              <MapTimePanel
                map={map}
                year={year}
                activeIndex={activeIndex}
                playing={tourRunning}
                eventColor={PALETTE.mongol}
                onToggleTour={toggleTour}
                onScrub={scrubTo}
                onJump={index => { revealMap(); void jumpToEvent(index); }}
              />
            )}
          </div>
        )}
      </div>
      {placeSheet}
    </div>
  );
};

export default StoryMapPage;
